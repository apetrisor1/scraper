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

module.exports.extractArrayFromRawData = (rawData) => {
  const { data: { results } } = rawData

  return results
}

// Builds the payload according to: https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html
module.exports.buildOpenSearchBulkPayload = (data, index) => {
  return data.map(entry => {
    const adjustedEntry = adjustObjectForOpenSearch(entry);

    return JSON.stringify({ index: { '_index': index, '_id': adjustedEntry.id } }) + '\n' + JSON.stringify(adjustedEntry)
  }).join('\n') + '\n'
}
