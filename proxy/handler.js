require('dotenv').config()

const axios = require('axios')
const express = require('express')
const serverless = require('serverless-http')

const app = express()
app.use(express.json())

const {
  buildOpenSearchBulkPayload,
  getBulkOperationStats,
  getIdsFromRawData
} = require('./helper')
const {
  insertBulk
} = require('./openSearchService')
const {
  setCurrentProxy,
  setProxyBusyStatus,
  setLatestProcessedSourceIds
} = require('./dynamoDB')

app.post('/', async ({ body }, res, next) => {
  const index = process.env.OPENSEARCH_INDEX

  try {
    await setProxyBusyStatus(true)

    const parsedBody = JSON.parse(body);
    const { dataURL, proxyUsed } = parsedBody;

    await setCurrentProxy(proxyUsed)

    const { data: rawData } = await axios.get(dataURL)

    const openSearchBulkPayload = buildOpenSearchBulkPayload(rawData, index)

    const { data: { items } } = await insertBulk(openSearchBulkPayload)

    await setLatestProcessedSourceIds(
      getIdsFromRawData(rawData)
    )

    await setProxyBusyStatus(false)

    return res.send(
      getBulkOperationStats(items)
    )
  } catch (e) {
    console.log('ERR main handler', JSON.stringify(e))
    return res.send(JSON.stringify(e))
  }
})

app.use((req, res, next) => {
  return res.status(404).json({
    error: 'Not Found',
  })
})

module.exports.handler = serverless(app)
