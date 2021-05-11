'use strict'
const mysql = require('mysql2/promise')
const isOffline = process.env['IS_OFFLINE']
const { dbConfig } = require(`${isOffline ? '../..' : '.'}/commons/dbConfig`)
let { response, getBody, escapeFields } = require(`${
  isOffline ? '../..' : '.'
}/commons/utils`)
let storage = require('./storage')

const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })

//Suppliers
module.exports.read = async (event, context) => {
  const connection = await mysql.createConnection(dbConfig)
  try {
    const [destinations] = await connection.execute(storage.readDestinations())

    return response(200, destinations, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, connection)
  }
}

module.exports.create = async (event, context) => {
  const connection = await mysql.createConnection(dbConfig)
  try {
    const requiredFields = ['name']
    const body = escapeFields(getBody(event))
    const errorFields = requiredFields.filter(k => !body[k])

    if (errorFields.length > 0) {
      throw new Error(`The fields ${errorFields.join(', ')} are required`)
    }
    const [destinations] = await connection.execute(
      storage.createDestination(body)
    )

    return response(200, destinations, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, connection)
  }
}

module.exports.update = async (event, context) => {
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

    const [destinations] = await connection.execute(
      storage.updateDestination(body, id)
    )

    return response(200, destinations, connection)
  } catch (e) {
    console.log(e, 'catch')
    return response(400, e, connection)
  }
}

module.exports.delete = async event => {
  const connection = await mysql.createConnection(dbConfig)
  try {
    const id =
      event.pathParameters && event.pathParameters.id
        ? JSON.parse(event.pathParameters.id)
        : undefined

    const [destinations] = await connection.execute(
      storage.deleteDestination(id)
    )

    return await response(200, destinations, connection)
  } catch (error) {
    console.log(error)
    return await response(400, error, connection)
  }
}
