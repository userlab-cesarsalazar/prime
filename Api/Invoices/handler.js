'use strict'
const mysql = require('mysql2/promise')
const moment = require('moment-timezone')
const isOffline = process.env['IS_OFFLINE']
const { dbConfig } = require(`${isOffline ? '../..' : '.'}/commons/dbConfig`)
const { response, notifyEmail } = require(`${isOffline ? '../..' : '.'}/commons/utils`)
const { buildXML, generateCorrelative } = require('./functions')
const request = require('request')
const xml2js = require('xml2js')
const SOAP = require('soap');
const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })
const sns = new AWS.SNS()

let storage = require('./invoiceStorage')

module.exports.create = async (event, context) => {
  try {
    let data = JSON.parse(event.body)
    
    const validation = storage.isEmpty(data)
    if ( validation ) throw `missing_parameter. ${validation}`
    
    const connection = await mysql.createConnection(dbConfig)
  
    const date = moment().tz('America/Guatemala').format('YYYY-MM-DD hh:mm:ss')
    
    const correlative = await generateCorrelative(connection,storage.getCorrelative())
    
    const [create] = await connection.execute(storage.post(data, date, correlative))
    
    if(!create)
      throw Error('Error creating Header Invoices')
    
    data.transaction_number = create.insertId
    
    //build XML
    const xml_form = buildXML(data, moment)
  
    let invoiceData = {
      Cliente: process.env['CLIENT_FACT_DEV'],
      Usuario:process.env['USER_FACT_DEV'],
      Clave: process.env['PASSWORD_FACT_DEV_ID'],
      Nitemisor: process.env['NIT_FACT_DEV'],
      Xmldoc: xml_form
    }
    // header invoice
    
    //create detail
    if(create.affectedRows > 0 ){
      await Promise.all(data.items.map(async (x) => {
        let detail = await connection.execute(storage.createDetail(x,create.insertId))
        
        //download to Inventory
        //await connection.execute(storage.downloadSimple(date,x.package_id))
        return detail
      }));
   }
    const log = await connection.execute(storage.saveToLog(invoiceData, date,create.insertId))
    if(!log[0].insertId)
      throw Error('Error creating log')
    
    const xml_response = await storage.makeRequestSoap(SOAP, process.env['URL_DEV_FACT'], invoiceData)
    
    const json = await storage.parseToJson(xml_response.Respuesta, xml2js,date)
    
    if(json.Errores)
      throw Error(JSON.stringify(json.Errores.Error))
    
    let serializerResponse = {
      create_at: json.DTE ? json.DTE.FechaEmision[0] : null,
      certification_date: json.DTE.FechaCertificacion ? json.DTE.FechaCertificacion[0] : null,
      autorization_number: json.DTE.NumeroAutorizacion? json.DTE.NumeroAutorizacion[0] : null,
      sat_number: json.DTE.Numero ? json.DTE.Numero[0] : null,
      error: json.DTE.Error ? json.DTE.Error[0] : null,
      pdf: json.DTE.Pdf[0],
      xml: json.DTE.Xml[0]
    }
    //console.log(serializerResponse, 'serializerResponse')
    
    await connection.execute(storage.updatedToLog(serializerResponse, date,log[0].insertId))
    await connection.execute(storage.updatedDocument(serializerResponse, create.insertId))
  
    if(serializerResponse.error)
      throw new Error(JSON.stringify(serializerResponse.error))
    
    delete serializerResponse.pdf
    delete serializerResponse.xml
 
    return response(200, serializerResponse, connection)
  } catch (e) {
    console.log(e)
    return response(400, e.message, null)
  }
}

module.exports.documents = async (event) => {
  try {
  
    const connection = await mysql.createConnection(dbConfig)
    
    const [documents] =  await connection.execute(storage.get())
  
    return response(200, documents, connection)
  }catch (e) {
    return response(400, e.message, null)
  }
}

module.exports.document = async (event) => {
  try {
    const id = event.pathParameters && event.pathParameters.id ? JSON.parse(event.pathParameters.id) : undefined
    
    if(!id)
      throw Error('Missing_id')
    
    const connection = await mysql.createConnection(dbConfig)
    
    const [documents] =  await connection.execute(storage.getDetail(id))
    
    return response(200, documents, connection)
  }catch (e) {
    return response(400, e.message, null)
  }
}

module.exports.documentPDF = async (event) => {
  try {
    const id = event.pathParameters && event.pathParameters.id ? JSON.parse(event.pathParameters.id) : undefined
    
    if(!id)
      throw Error('Missing_id')
    
    const connection = await mysql.createConnection(dbConfig)
    
    const [documents] =  await connection.execute(storage.getDetailPDF(id))
    
    return response(200, documents && documents[0] ? documents[0] : [], connection)
  }catch (e) {
    return response(400, e.message, null)
  }
}

module.exports.documentByClient = async (event) => {
  try {
    const client = event.pathParameters && event.pathParameters.id ? event.pathParameters.id : undefined
    
    if(!client) throw Error('Missing_client')
    
    const connection = await mysql.createConnection(dbConfig)
    
    const [documents] =  await connection.execute(storage.getDocumentByClient(client))
    
    return response(200, documents, connection)
  }catch (e) {
    return response(400, e.message, null)
  }
}








