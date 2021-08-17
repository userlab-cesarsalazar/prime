const Base64 = require('base-64')
const request = require('request')

module.exports.openSession = async () => {
  const credential = Base64.encode(process.env['TIGO_USER'] + ':' + process.env['TIGO_PASSWORD'])
  const options = {
    method: 'POST',
    url: 'https://prod.api.tigo.com/oauth/client_credential/accesstoken?grant_type=client_credentials',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credential}`,
    },
  }
  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (error) reject(error)
      console.log(response.body)
      resolve(JSON.parse(response.body))
    })
  })
}

module.exports.sendSMSviaSNS = async params => {
  const payload = {
    warehouse: params.warehouse,
    profile: params.profile,
    data: params.data,
  }

  const snsParams = {
    Message: JSON.stringify(payload),
    TopicArn: `arn:aws:sns:us-east-1:${process.env['ACCOUNT_ID']}:sms-${process.env['STAGE']}-tigo`,
  }
  console.log('SNS params', snsParams)
  await sns.publish(snsParams).promise()
}

module.exports.getSendSMSviaSNSParams = data => ({
  data: {
    package_id: data.package_id,
    tracking: data.tracking,
    client_id: data.client_id,
    weight: data.weight,
    description: data.description,
    ing_date: data.ing_date,
    status: data.status,
    total: data.total,
  },
  profile: [
    {
      client_id: data.client_id,
      email: data.email,
      contact_name: data.contact_name,
      client_name: data.client_name,
      phone: data.phone,
    },
  ],
})
