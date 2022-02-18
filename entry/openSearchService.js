require('dotenv').config()
const axios = require('axios')



module.exports.getLatestEntryId = async () => {
  const username = process.env.OPENSEARCH_USERNAME
  const password = process.env.OPENSEARCH_PASSWORD
  const domain = process.env.OPENSEARCH_DOMAIN
  const index = process.env.OPENSEARCH_DOMAIN

  try {
    const response = await axios.get(`${domain}/${index}/_search?size=1&sort=updated_at:desc&_source=id`, {
      auth: { username, password },
      headers: { 'Content-Type': 'application/json' }
    });
  
    const { data: { hits: { hits } } } = response;
  
    return hits[0]._source.id
  } catch(err) {
    if (err.response.status = 404) {
      return null
    } else {
      throw err
    }
  }
}
