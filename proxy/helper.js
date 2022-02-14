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
        // Convert format differences that break the opensearch bulk payload
        adjusted[key] = value ? parseInt(value) : null
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

const extractArray = (rawData) => {
  const { data } = rawData
  const { data: { results } } = data

  return results
}

// Opensearch bulk payload follows elasticsearch pattern: https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html
module.exports.buildOpenSearchBulkPayload = (rawData, index) => {
  return extractArray(rawData).map(entry => {
    const adjustedEntry = adjustObjectForOpenSearch(entry);

    return JSON.stringify({ index: { '_index': index } }) + '\n' + JSON.stringify(adjustedEntry)
  }).join('\n') + '\n'
}

