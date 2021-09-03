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
    
    let api24 = await new Promise((resolve, reject) => {
      request.post({
        headers: {
          'content-type': 'application/json',
          'Authorization': process.env['TOKEN_24API']
        },
        url: process.env['URL_24API'],
        body: params,
        json:true
      }, function(error, response, body){
        if(error)
          reject(error)
        resolve(body)
      });
    })
    
    const connection = await mysql.createConnection(dbConfig)
    let [packages] = await connection.execute(storage.get(params))
    
    if(packages.length > 0 ){
      packages.forEach(x => {
        if(x.ing_date){
          x.ing_date = new Date(x.ing_date)
        }
      })
    }
    
    let data = {
      warehouse: packages,
      api24: {...api24},
      
    }

    return response(200, data, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, null)
  }
}

