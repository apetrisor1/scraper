const AWS = require('aws-sdk')

AWS.config.update({
  region: 'eu-central-1',
  endpoint: 'https://dynamodb.eu-central-1.amazonaws.com'
})

const docClient = new AWS.DynamoDB.DocumentClient()

const TableName = 'lambda'

module.exports.setCurrentProxy = async (data) => {
  const params = {
    TableName,
    Item: {
      index: 2,
      data,
      description: 'Latest lambda used'
    }
  };

  return docClient.put(params).promise()
}

module.exports.setProxyBusyStatus = async (data) => {
  const params = {
    TableName,
    Item: {
      index: 4,
      data,
      description: 'Is any of the proxies busy?'
    }
  };

  return docClient.put(params).promise()
}

module.exports.setLatestProcessedSourceIds = async (data) => {
  const params = {
    TableName,
    Item: {
      index: 5,
      data,
      description: 'Source IDs processed last by the most recent proxy invocation'
    }
  };

  return docClient.put(params).promise()
}