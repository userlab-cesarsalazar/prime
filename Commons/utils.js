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
}

module.exports = common
