require('dotenv').config()

const axios = require('axios')
const express = require('express')
const serverless = require('serverless-http')

const app = express()

const {
  getRunPermission,
  setRunPermission,
  setProxyUrls,
  setProxyBusyStatus,
  getProxyBusyStatus,
  getLastUsedProxy,
  getLatestProcessedSourceIds
} = require('./dynamoDB')

const { getLatestEntryId } = require('./openSearchService')

const getNextProxy = async () => {
  const proxyUrls = process.env.PROXY_DATA_URLS.split(',')
  const lastUsedProxy = await getLastUsedProxy()
  const lastUsedProxyUrl = lastUsedProxy && lastUsedProxy.Item && lastUsedProxy.Item.data

  if (!lastUsedProxyUrl) {
    return proxyUrls[0]
  } else {
    let index = proxyUrls.indexOf(lastUsedProxyUrl)

    if (index === -1 || index === proxyUrls.length - 1) {
      index = 0 
    } else {
      index++
    }
  
    return proxyUrls[index]
  }
}

const runLoop = async ({ skip, latestEntryId }, res) => {
  const dataURL = skip ? process.env.DATA_URL + `&__skip=${skip}` : process.env.DATA_URL
  
  const { Item: { data: shouldContinue } } = await getRunPermission()

  if (!shouldContinue) {
    // this is a good place to stop the cron-job programatically
    console.log('Entry point not yet configured. POST root/start to enable flow start.')
    return res.send('Entry point not yet configured. POST root/start to enable flow start.')
  }

  const { Item: { data: proxiesAreBusy } } = await getProxyBusyStatus()

  if (proxiesAreBusy) {
    console.log('Proxies are busy')
    return res.send('Proxies are busy')
  }

  const proxyUsed = await getNextProxy()

  const { data: bulkInsertResults } = await axios.post(proxyUsed, JSON.stringify({
    dataURL,
    proxyUsed
  }))

  console.log({ ...bulkInsertResults, proxyUsed, dataURL })

  const { Item: { data: idsIndexedLast } } = await getLatestProcessedSourceIds();

  if (!idsIndexedLast.includes(latestEntryId)) {
    console.log('Sleeping 10 seconds then calling next proxy for the next page')
    console.log(
      'IDs indexed by last proxy execution ', idsIndexedLast,
      'do not contain latest open search entry:', latestEntryId
    )

    setTimeout(async () => {
      await runLoop({ skip: skip + 30, latestEntryId }, res)
    }, 10000)
  } else {
    console.log('Got everything')
    return res.send('Got everything')
  }
}

app.get('/', async (req, res, next) => {
  try {
    const latestEntryId = await getLatestEntryId()

    const result = await runLoop({ skip: null, latestEntryId }, res)

    return result
  } catch (e) {
    await setProxyBusyStatus(false)
    return res.send(JSON.stringify(e))
  }
})

app.post('/start', async (req, res, next) => {
  try {
    if (!process.env.DATA_URL) {
      throw new Error('API URL not set in .env')
    }

    if (!process.env.PROXY_DATA_URLS) {
      throw new Error('Proxy URLs not set in .env')
    }

    await setProxyUrls(process.env.PROXY_DATA_URLS)
    await setRunPermission(true)
    await setProxyBusyStatus(false)

    return res.send('Proxy chain ready to start.')
  } catch (e) {
    return res.status(500).send(e)
  }
})

app.post('/stop', async (req, res, next) => {
  try {
    await setRunPermission(false)

    return res.send('Stopped proxies chain.')
  } catch (e) {
    return res.status(500).send(e)
  }
})

app.use((req, res, next) => {
  return res.status(404).json({
    error: 'Not Found',
  })
})

module.exports.handler = serverless(app)

