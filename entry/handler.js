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
} = require('./dynamoDB')

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

app.post('/', async (req, res, next) => {
  try {
    const { Item: { data: shouldContinue } } = await getRunPermission()

    if (!shouldContinue) {
      // this is a good place to stop the cron-job programatically
      return res.send("Stopped")
    }

    const { Item: { data: proxiesAreBusy } } = await getProxyBusyStatus()

    if (proxiesAreBusy) {
      return res.send("Proxies are busy")
    }

    const nextProxy = await getNextProxy()

    const { data: bulkInsertResults } = await axios.post(nextProxy, JSON.stringify(nextProxy))
    // this is a good place to adjust the cron-job programatically according to bulk insert results

    return res.send({
      ...bulkInsertResults,
      proxyUsed: nextProxy
    })
  } catch (e) {
    return res.status(500).send(JSON.stringify(e))
  }
})

app.post('/start', async (req, res, next) => {
  try {
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

