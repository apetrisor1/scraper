require('dotenv').config()

const axios = require('axios')
const express = require('express')
const serverless = require('serverless-http')

const app = express()
app.use(express.json())

const {
  buildOpenSearchBulkPayload,
  extractArrayFromRawData
} = require('./helper')
const {
  insertBulk
} = require('./openSearchService')
const {
  setCurrentProxy,
  setProxyBusyStatus
} = require('./dynamoDB')

app.post('/', async (req, res, next) => {
  const index = process.env.OPENSEARCH_INDEX

  try {
    await setProxyBusyStatus(true)

    await setCurrentProxy(JSON.parse(req.body))

    const { data: rawData } = await axios.get(process.env.DATA_URL)

    const data = extractArrayFromRawData(rawData);

    const openSearchBulkPayload = buildOpenSearchBulkPayload(data, index)

    await insertBulk(openSearchBulkPayload)

    await setProxyBusyStatus(false)

    return res.send(true)
  } catch (e) {
    return res.send(JSON.stringify(e))
  }
})

app.use((req, res, next) => {
  return res.status(404).json({
    error: 'Not Found',
  })
})

module.exports.handler = serverless(app)
