'use strict'
const mysql = require('mysql2/promise')
const moment = require('moment-timezone')
const isOffline = process.env['IS_OFFLINE']
const { dbConfig } = require(`${isOffline ? '../..' : '.'}/commons/dbConfig`)
let { response } = require(`${isOffline ? '../..' : '.'}/commons/utils`)
let storage = require('./warehouseStorage')

const date = moment()
  .tz('America/Guatemala')
  .format('YYYY-MM-DD')

const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })
const sns = new AWS.SNS()

//Suppliers
module.exports.getSupplier = async (event, context) => {
  try {
    
    const connection = await mysql.createConnection(dbConfig)
    const [suppliers] = await connection.execute(storage.getSuppliers())

    return response(200, suppliers, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, null)
  }
}

module.exports.createSupplier = async (event, context) => {
  try {
    let data = JSON.parse(event.body)
    if (!data.name ) throw 'missing_parameter.'
    const connection = await mysql.createConnection(dbConfig)
    const [suppliers] = await connection.execute(storage.createSupplier(data))
    
    return response(200, suppliers, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, null)
  }
}

module.exports.putSuppliers = async (event, context) => {
  try {
    let data = JSON.parse(event.body)
    const id = event.pathParameters && event.pathParameters.id ? JSON.parse(event.pathParameters.id) : undefined
    
    if (!data.name || !id) throw 'missing_parameter.'
    const connection = await mysql.createConnection(dbConfig)
    const [Suppliers] = await connection.execute(storage.putSuppliers(data, id))
    
    return response(200, Suppliers, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, null)
  }
}

//Carriers
module.exports.getCarries = async (event, context) => {
  try {
    
    const connection = await mysql.createConnection(dbConfig)
    const [carries] = await connection.execute(storage.getCarries())
    
    return response(200, carries, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, null)
  }
}

module.exports.createCarrie = async (event, context) => {
  try {
    let data = JSON.parse(event.body)
    if (!data.name ) throw 'missing_parameter.'
    const connection = await mysql.createConnection(dbConfig)
    const [carries] = await connection.execute(storage.createCarries(data))
    
    return response(200, carries, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, null)
  }
}

module.exports.putCarrie = async (event, context) => {
  try {
    let data = JSON.parse(event.body)
    const id = event.pathParameters && event.pathParameters.id ? JSON.parse(event.pathParameters.id) : undefined
    
    if (!data.name || !id) throw 'missing_parameter.'
    const connection = await mysql.createConnection(dbConfig)
    const [carries] = await connection.execute(storage.putCarrie(data, id))
    
    return response(200, carries, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, null)
  }
}


