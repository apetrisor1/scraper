const { divide, pow, bignumber } = require('mathjs')

const convertEpochToJavascriptTimestamp = (timestamp) => (
  timestamp && timestamp.toString().length === 10 ?
      timestamp.toString() + "000" :
      timestamp
)

const convertSubMillisecondTimestampToJavascriptTimestamp = (timestamp) => (
  timestamp && timestamp.toString().length > 13 ?
      timestamp.toString().slice(0, 13) :
      timestamp
)

/* Turns long string price into a smaller (divided by 10pow20) floating point number. */
const getShortCryptoPrice = (price) => {
  try {
    let result = bignumber(price)
    result = divide(result, pow(10, 20))
    return parseFloat(result)
  } catch(e) {
    console.log('ERR getShortCryptoPrice', JSON.stringify(e))
    return 0
  }
}

getIsoDateOrNull = (timestamp) => {
  try {
    timestamp = convertEpochToJavascriptTimestamp(timestamp)
    timestamp = convertSubMillisecondTimestampToJavascriptTimestamp(timestamp)
    return new Date(parseInt(timestamp)).toISOString()
  } catch(e) {
      console.log('ERR getIsoDateOrNull', JSON.stringify(e))
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

    return adjusted
  }, {})
}

/** Builds the payload according to: https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html */
module.exports.buildOpenSearchBulkPayload = (rawData, index, aggregateEntries = false) => {
  const { data: { results } } = rawData

  return results.map(entry => {
    const adjustedEntry = adjustObjectForOpenSearch(entry);

    let indexAndIdObject = { '_index': index }
    /* Save entries with their own ID and overwrite them if receiving an updated entry in raw data. 
    By default, we'll save each entry as a separate record, even if it's an updated version of the same entry*/
    if (aggregateEntries) {
      Object.assign(indexAndIdObject, { '_id': adjustedEntry.id })
    }

    return JSON.stringify({ index: indexAndIdObject }) + '\n' + JSON.stringify(adjustedEntry)
  }).join('\n') + '\n'
}

module.exports.getBulkOperationStats = (items) => ({
  created: items.reduce((acc, val) => (acc += val.index.result === 'created' ? 1 : 0), 0),
  updated: items.reduce((acc, val) => (acc += val.index.result === 'updated' ? 1 : 0), 0)
})