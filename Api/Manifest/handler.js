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

module.exports.readManifest = async (event, context) => {
    const connection = await mysql.createConnection(dbConfig)
    try {
        const [manifests] = await connection.execute(storage.readManifesto())

        return response(200, manifests[0], connection)
    } catch (e) {
        return response(400, e, connection)
    }
}

module.exports.createManifest = async (event, context) => {
    const connection = await mysql.createConnection(dbConfig)
    try {
        const requiredFields = ['description']
        const body = escapeFields(getBody(event))

        const errorFields = requiredFields.filter(k => !body[k])

        if (errorFields.length > 0) {
            throw new Error(`The fields ${errorFields.join(', ')} are required`)
        }

        const [manifest] = await connection.execute(storage.createManifest(body))

        return response(200, manifest, connection)
    } catch (e) {
        return response(400, e, connection)
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

        const [Manifest] = await connection.execute(
            storage.updateManifest(body, id)
        )

        return response(200, Manifest, connection)
    } catch (e) {
        return response(400, e, connection)
    }
}
