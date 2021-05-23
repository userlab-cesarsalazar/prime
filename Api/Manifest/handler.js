'use strict'
const mysql = require('mysql2/promise')
const isOffline = process.env['IS_OFFLINE']
const { dbConfig } = require(`${isOffline ? '../..' : '.'}/commons/dbConfig`)
let { response, getBody, escapeFields } = require(`${
    isOffline ? '../..' : '.'
}/commons/utils`)
let storage = require('./manifestStorage')

const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })

module.exports.readManifest = async (event, context) => {
    const connection = await mysql.createConnection(dbConfig)
    try {
        const [manifests] = await connection.execute(storage.readManifest())

        return response(200, manifests, connection)
    } catch (error) {
        const message = error.message ? error.message : error

        return await response(400, { error: message }, connection)
    }
}

module.exports.createManifest = async (event, context) => {
    const connection = await mysql.createConnection(dbConfig)
    try {
        const requiredFields = ['description']
        const body = escapeFields(getBody(event))
        const errorFields = requiredFields.filter(k => !body[k])

        if (errorFields.length > 0 || !body) {
            throw new Error(`The fields ${errorFields.join(', ')} are required`)
        }

        const [manifest] = await connection.execute(storage.createManifest(body))

        return response(200, manifest, connection)
    } catch (error) {
        const message = error.message ? error.message : error

        return await response(400, { error: message }, connection)
    }
}

module.exports.updateManifest = async (event, context) => {
    const connection = await mysql.createConnection(dbConfig)
    try {
        const id =
            event.pathParameters && event.pathParameters.id
                ? JSON.parse(event.pathParameters.id)
                : undefined
        const requiredFields = ['description','status']
        const body = escapeFields(getBody(event))
        const errorFields = requiredFields.filter(k => !body[k])

        if (errorFields.length > 0) {
            throw new Error(`The fields ${errorFields.join(', ')} are required`)
        }

        const [manifest] = await connection.execute(
            storage.updateManifest(body, id)
        )

        return response(200, manifest, connection)
    } catch (error) {
        const message = error.message ? error.message : error

        return await response(400, { error: message }, connection)
    }
}

module.exports.readMaxManifest = async (event, context) => {
    const connection = await mysql.createConnection(dbConfig)
    try {
        const [manifest] = await connection.execute(storage.getMAXManifest())

        return response(200, manifest, connection)
    } catch (error) {
        const message = error.message ? error.message : error

        return await response(400, { error: message }, connection)
    }
}

module.exports.exportManifest = async () => {

}
