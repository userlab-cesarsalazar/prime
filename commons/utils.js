let common = {
  response: (status, body, connection) => {
    if (connection) connection.end()

    return {
      statusCode: status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(body),
    }
  },
  fileResponse: (status, body, connection, manifestName) => {
    if (connection) connection.end()

    return {
      statusCode: status,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=manifest-${manifestName}.xlsx`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: body,
      isBase64Encoded: true,
    }
  },
  wakeUpLambda: event => {
    if (event.source === 'serverless-plugin-warmup') {
      console.log('WarmUP - Lambda is warm!')
      return true
    }
    return false
  },
  notifyEmail(awsContext, emailData) {
    let mailList = emailData.mailList || ['cesar.augs@gmail.com']
    let params = {
      Destination: {
        ToAddresses: mailList,
        BccAddresses: emailData.bcc || [],
      },
      Message: {
        Body: emailData.body,
        Subject: {
          Charset: 'UTF-8',
          Data: emailData.subject,
        },
      },
      Source: emailData.from /* required */,
    }
    // Create the promise and SES service object
    return new awsContext.SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise()
  },
  getBody: event => {
    const postBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body
    const snsBody = event.Records ? JSON.parse(event.Records[0].Sns.Message) : {}

    return event.body ? postBody : snsBody
  },
  escapeFields: (data = {}, fieldsToExclude = []) => {
    const escapeStr = str => {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\\/g, '\\\\')
        .replace(/\$/g, '\\$')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .trim()
    }

    let escapedBody = {}

    Object.keys(data).forEach(
      k => (escapedBody[k] = fieldsToExclude.length > 0 && fieldsToExclude.some(fte => fte === k) ? data[k] : escapeStr(data[k]))
    )

    return escapedBody
  },
  pad: function (num, size) {
    var str = num + ''
    while (str.length < size) str = '0' + str
    return str
  },
}

module.exports = common
