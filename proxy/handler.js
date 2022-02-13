require('dotenv').config()

const axios = require('axios')
const express = require('express')
const serverless = require('serverless-http')

const app = express()
app.use(express.json())

const {
  setCurrentProxy,
  setProxyBusyStatus
} = require('./dynamoDB')

const extractFormattedData = (rawData) => {
  const { data } = rawData
  const { data: { results } } = data

  return results
}

const insertIntoOpenSearch = async (payload) => {
  const replacer = (name, val) => {
    switch(name) {
      case "issued_at":
        return val ? parseInt(val) : null
      default:
        return val
    }
  }

  const username = process.env.OPENSEARCH_USERNAME
  const password = process.env.OPENSEARCH_PASSWORD
  const domain = process.env.OPENSEARCH_DOMAIN
  const index = process.env.OPENSEARCH_INDEX

  return axios.post(
    `${domain}/${index}/_doc/1`,
    JSON.stringify({ data: payload }, replacer),
    {
      auth: { username, password },
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

app.post('/', async (req, res, next) => {
  try {
    const rawData = await axios.get(process.env.DATA_URL)

    await setProxyBusyStatus(true)

    await setCurrentProxy(JSON.parse(req.body))

    await insertIntoOpenSearch(
      extractFormattedData(rawData)
    )

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
