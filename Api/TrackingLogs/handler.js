'use strict'
const mysql = require('mysql2/promise')
const moment = require('moment-timezone')
const isOffline = process.env['IS_OFFLINE']
const { dbConfig } = require(`${isOffline ? '../..' : '.'}/commons/dbConfig`)
let { response } = require(`${isOffline ? '../..' : '.'}/commons/utils`)
let storage = require('./storage')
const date = moment().tz('America/Guatemala').format('YYYY-MM-DD HH:mm:ss')

module.exports.create = async (event, context) => {
    let connection = await mysql.createConnection(dbConfig)
    try {

        let dataParams = event.body
      ? typeof event.body === 'string'
        ? JSON.parse(event.body)
        : event.body
      : event.Records
      ? JSON.parse(event.Records[0].Sns.Message)
      : null
        
        console.log("dataParams >> ",dataParams)
                    
    if (!dataParams) throw 'missing_parameter.'

    await connection.execute(storage.post(dataParams,dataParams.request,date))

    return response(200, {message:'successful'}, connection)
    } catch (error) {
        console.log("log general error > ",error)
        return response(400, error, connection)
    }    

}