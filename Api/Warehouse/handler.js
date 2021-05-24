'use strict'
const mysql = require('mysql2/promise')
const isOffline = process.env['IS_OFFLINE']
const { dbConfig } = require(`${isOffline ? '../..' : '.'}/commons/dbConfig`)
let { response, getBody, escapeFields } = require(`${
  isOffline ? '../..' : '.'
}/commons/utils`)
let storage = require('./warehouseStorage')

const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })

//Suppliers
module.exports.readSupplier = async (event, context) => {
  const connection = await mysql.createConnection(dbConfig)
  try {
    const [suppliers] = await connection.execute(storage.readSuppliers())

    return response(200, suppliers, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, connection)
  }
}

module.exports.createSupplier = async (event, context) => {
  const connection = await mysql.createConnection(dbConfig)
  try {
    const requiredFields = ['code', 'name', 'phone', 'address']
    const body = escapeFields(getBody(event))
    const errorFields = requiredFields.filter(k => !body[k])

    if (errorFields.length > 0) {
      throw new Error(`The fields ${errorFields.join(', ')} are required`)
    }

    const [suppliers] = await connection.execute(storage.createSupplier(body))

    return response(200, suppliers, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, connection)
  }
}

module.exports.updateSuppliers = async (event, context) => {
  const connection = await mysql.createConnection(dbConfig)
  try {
    const id =
        event.pathParameters && event.pathParameters.id
            ? JSON.parse(event.pathParameters.id)
            : undefined
    const requiredFields = ['name', 'phone', 'address']
    const body = escapeFields(getBody(event))
    const errorFields = requiredFields.filter(k => !body[k])

    if (errorFields.length > 0) {
      throw new Error(`The fields ${errorFields.join(', ')} are required`)
    }

    const [Suppliers] = await connection.execute(
        storage.updateSuppliers(body, id)
    )

    return response(200, Suppliers, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, connection)
  }
}

module.exports.deleteSupplier = async event => {
  const connection = await mysql.createConnection(dbConfig)
  try {
    const id =
        event.pathParameters && event.pathParameters.id
            ? JSON.parse(event.pathParameters.id)
            : undefined

    const [supplier] = await connection.execute(storage.deleteSupplier(id))

    return await response(200, supplier, connection)
  } catch (error) {
    console.log(error)
    return await response(400, error, connection)
  }
}

//Carriers
module.exports.readCarries = async (event, context) => {
  const connection = await mysql.createConnection(dbConfig)
  try {
    const [carries] = await connection.execute(storage.readCarries())

    return response(200, { message: carries }, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, connection)
  }
}

module.exports.createCarrie = async (event, context) => {
  const connection = await mysql.createConnection(dbConfig)
  try {
    const requiredFields = ['code', 'name']
    const body = escapeFields(getBody(event))
    const errorFields = requiredFields.filter(k => !body[k])

    if (errorFields.length > 0) {
      throw new Error(`The fields ${errorFields.join(', ')} are required`)
    }

    const [carries] = await connection.execute(storage.createCarries(body))

    return response(200, carries, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, connection)
  }
}

module.exports.updateCarrie = async (event, context) => {
  const connection = await mysql.createConnection(dbConfig)
  try {
    const id =
        event.pathParameters && event.pathParameters.id
            ? JSON.parse(event.pathParameters.id)
            : undefined
    const requiredFields = ['name']
    const body = escapeFields(getBody(event))
    const errorFields = requiredFields.filter(k => !body[k])

    if (errorFields.length > 0) {
      throw new Error(`The fields ${errorFields.join(', ')} are required`)
    }

    const [carries] = await connection.execute(storage.updateCarrie(body, id))

    return response(200, carries, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, connection)
  }
}

module.exports.deleteCarrie = async event => {
  const connection = await mysql.createConnection(dbConfig)
  try {
    const id =
        event.pathParameters && event.pathParameters.id
            ? JSON.parse(event.pathParameters.id)
            : undefined

    const [carries] = await connection.execute(storage.deleteCarries(id))

    return await response(200, carries, connection)
  } catch (error) {
    console.log(error)
    return await response(400, error, connection)
  }
}

module.exports.createWarehouseEntry = async event => {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const requiredFields = [
      'client_id',
      'supplier_id',
      'carrier_id',
      'package_description',
      'invoice_price',
      'destination_id',
      'tracking',
      'manifest_id',
      'weight',
      'ing_date'
    ]

    const body = escapeFields(getBody(event))
    const errorFields = requiredFields.filter(k => !body[k])

    if (errorFields.length > 0 || !body) {
      throw new Error(`The fields ${errorFields.join(', ')} are required`)
    }

    const [manifest] = await connection.execute(storage.findManifestById(body.manifest_id))

    if(!manifest){
      throw new Error('Invalid manifest Id')
    }

    const [result] = await connection.execute(storage.findMaxPaqueteId())

    const newGuiaId = parseInt(result[0].id) + 1

    const [wareHouse] = await connection.execute(storage.createWarehouseEntry(body,newGuiaId))

    return await response(200, wareHouse, connection)
  } catch (error) {

    const message = error.message ? error.message : error

    return await response(400, { error: message }, connection)

  }
}
