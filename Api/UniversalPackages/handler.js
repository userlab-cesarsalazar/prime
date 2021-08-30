'use strict'
const mysql = require('mysql2/promise')
const moment = require('moment-timezone')
const request = require('request')
const isOffline = process.env['IS_OFFLINE']
const { dbConfig } = require(`${isOffline ? '../..' : '.'}/commons/dbConfig`)
let { response } = require(`${isOffline ? '../..' : '.'}/commons/utils`)
let storage = require('./universalStorage')
const date = moment()
  .tz('America/Guatemala')
  .format('YYYY-MM-DD')

const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })


module.exports.read = async (event, context) => {
  try {
    let params = {}
    
    if(event.pathParameters.tracking)
      params.trackingNumber = event.pathParameters.tracking
    console.log(process.env['TOKEN_24API']);
    console.log(process.env['SHIP_API']);
    let api24 = await new Promise((resolve, reject) => {
      request.post({
        headers: {
          'content-type': 'application/json',
          'Authorization': 'Bearer apik_gwIJFvWHJCCIWYG8FR4g4RcsU8FkwM'
        },
        url: 'https://api.ship24.com/public/v1/tracking/search',
        body: params,
        json:true
      }, function(error, response, body){
        console.log(body);
        resolve(body)
      });
    })
    
    const connection = await mysql.createConnection(dbConfig)
    const [packages] = await connection.execute(storage.get(params))
    
    let data = {
      api24: {...api24},
      wharehouse: packages
    }

    return response(200, data, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, null)
  }
}

module.exports.create = async (event, context) => {
  try {
    let data = JSON.parse(event.body)
    console.log(data);
    if (!data.tracking || !data.carrier ) throw 'missing_parameter.'
    
    const connection = await mysql.createConnection(dbConfig)
    const [packages] = await connection.execute(storage.post(data,date))
    
    return response(200, packages, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, null)
  }
}

