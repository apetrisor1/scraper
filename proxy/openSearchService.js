require('dotenv').config()
const axios = require('axios')

module.exports.insertBulk = async (payload) => {
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

module.exports.getLatestOpenSearchEntrySourceId = async (index) => {
  const username = process.env.OPENSEARCH_USERNAME
  const password = process.env.OPENSEARCH_PASSWORD
  const domain = process.env.OPENSEARCH_DOMAIN

  try {
    const response = await axios.get(`${domain}/${index}/_search?size=1`, {
      auth: { username, password },
      headers: { 'Content-Type': 'application/json' }
    })

    const { data: { hits: { hits: [latestEntry] } } } = response
  
    const { _source: { id: latestEntryOwnId } } = latestEntry
  
    return latestEntryOwnId
  } catch (err) {
    if (err.response.status = 404) {
      // Index doesn't exist yet, will be created after first bulk POST
      return null
    } else {
      throw err
    }
  }
}