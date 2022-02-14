const AWS = require('aws-sdk')

AWS.config.update({
  region: 'eu-central-1',
  endpoint: 'https://dynamodb.eu-central-1.amazonaws.com'
})

const docClient = new AWS.DynamoDB.DocumentClient()

const TableName = 'lambda'

module.exports.setProxyUrls = async (data) => {
  const params = {
    TableName,
    Item: {
      index: 0,
      data,
      description: 'A list of all lambda proxies'
    }
  };

  return docClient.put(params).promise()
}

module.exports.getProxyUrls = async () => {
  const params = {
    TableName,
    Key: { index: 0 },
    ConsistentRead: true
  };

  return docClient.get(params).promise()
}

module.exports.setRunPermission = async (startStopBoolean) => {
  const params = {
    TableName,
    Item: {
      index: 1,
      data: startStopBoolean,
      description: 'Should lambdas keep going?'
    }
  };

  return docClient.put(params).promise()
}

module.exports.getRunPermission = async () => {
  const params = {
    TableName,
    Key: { index: 1 },
    ConsistentRead: true
  };

  return docClient.get(params).promise()
}

module.exports.getLastUsedProxy = async () => {
  const params = {
    TableName,
    Key: { index: 2 },
    ConsistentRead: true
  };

  return docClient.get(params).promise()
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

module.exports.getProxyBusyStatus = async () => {
  const params = {
    TableName,
    Key: { index: 4 },
    ConsistentRead: true
  };

  return docClient.get(params).promise()
}