require('dotenv').config()

const axios = require('axios')
const express = require('express')
const serverless = require('serverless-http')

const app = express()
app.use(express.json())

const { buildOpenSearchBulkPayload } = require('./helper');
const {
  setCurrentProxy,
  setProxyBusyStatus
} = require('./dynamoDB')

const insertBulk = async (payload) => {
  const username = process.env.OPENSEARCH_USERNAME
  const password = process.env.OPENSEARCH_PASSWORD
  const domain = process.env.OPENSEARCH_DOMAIN

  return axios.post(
    `${domain}/_bulk`,
    Buffer.from(payload),
    {
      auth: { username, password },
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

app.post('/', async (req, res, next) => {
  const index = process.env.OPENSEARCH_INDEX

  try {
    await setProxyBusyStatus(true)
    await setCurrentProxy(JSON.parse(req.body))

    const rawData = await axios.get(process.env.DATA_URL)
    const openSearchBulkPayload = buildOpenSearchBulkPayload(rawData, index)
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
