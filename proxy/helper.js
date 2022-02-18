const { divide, pow, bignumber } = require('mathjs')

const convertEpochToJavascriptTimestamp = (timestamp) => (
  timestamp.toString().length === 10 ?
      timestamp.toString() + "000" :
      timestamp
)

const convertSubMillisecondTimestampToJavascriptTimestamp = (timestamp) => (
  timestamp.toString().length > 13 ?
      timestamp.toString().slice(0, 13) :
      timestamp
)

/* Turns long string price into a smaller (divided by 10pow20) floating point number. */
const getShortCryptoPrice = (price) => {
  try {
    let result = bignumber(price)
    result = divide(result, pow(10, 24))
    return parseFloat(result)
  } catch(e) {
    console.log('ERR getShortCryptoPrice', JSON.stringify(e))
    return 0
  }
}

getIsoDateOrNull = (timestamp) => {
  try {
    if (!timestamp) return null
    timestamp = convertEpochToJavascriptTimestamp(timestamp)
    timestamp = convertSubMillisecondTimestampToJavascriptTimestamp(timestamp)
    return new Date(parseInt(timestamp)).toISOString()
  } catch(e) {
      console.log('ERR getIsoDateOrNull', e)
      return null
  }
}

const adjustObjectForOpenSearch = obj => {
  if (!obj) return null

  return Object.keys(obj).reduce((adjusted, key) => {
    let value = obj[key]

    if (typeof value === `object`) {
      value = adjustObjectForOpenSearch(value)
    } else if (typeof value === `string`) {
      // Replace characters that break the opensearch bulk payload
      value = value.replace(/\n/g, ``).replace(/\"/g, ``)
    }

    switch(key) {
      case "issued_at":
      case "expires_at":
      case "starts_at":
      case "updated_at":
        adjusted[key] = getIsoDateOrNull(value)
        break
      case "lowest_price":
      case "price":
        adjusted[key] = getShortCryptoPrice(value)
        break
      case "_id":
        // Bulk opensearch entries can't have _id field
        adjusted[`id`] = value
        break
      default:
        adjusted[key] = value
    }

    adjusted['indexed_at'] = new Date().getTime()

    return adjusted
  }, {})
}

/** Builds the payload according to: https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html */
module.exports.buildOpenSearchBulkPayload = (rawData, index, aggregateEntries = true) => {
  const { data: { results } } = rawData

  return results.map(entry => {
    const adjustedEntry = adjustObjectForOpenSearch(entry);

    let indexAndIdObject = { '_index': index }
    if (aggregateEntries) {
      Object.assign(indexAndIdObject, { '_id': Buffer.from(entry._id + '_' + entry.updated_at).toString('base64') })
    }

    return JSON.stringify({ index: indexAndIdObject }) + '\n' + JSON.stringify(adjustedEntry)
  }).join('\n') + '\n'
}

module.exports.getBulkOperationStats = (items) => ({
  created: items.reduce((acc, val) => (acc += val.index.result === 'created' ? 1 : 0), 0),
  updated: items.reduce((acc, val) => (acc += val.index.result === 'updated' ? 1 : 0), 0)
})