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
