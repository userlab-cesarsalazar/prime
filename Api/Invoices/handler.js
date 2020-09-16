'use strict'
const mysql = require('mysql2/promise')
const moment = require('moment-timezone')
const isOffline = process.env['IS_OFFLINE']
const { dbConfig } = require(`${isOffline ? '../..' : '.'}/commons/dbConfig`)
const { response } = require(`${isOffline ? '../..' : '.'}/commons/utils`)
const { buildXML, generateCorrelative } = require('./functions')
const xml2js = require('xml2js')
const SOAP = require('soap');
const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })
const sns = new AWS.SNS()

let storage = require('./invoiceStorage')

module.exports.create = async (event, context) => {
  try {
    let data = JSON.parse(event.body)
    console.log(data)
    const validation = storage.isEmpty(data)
    if ( validation ) throw `missing_parameter. ${validation}`
    
    const connection = await mysql.createConnection(dbConfig)
  
    const date = moment().tz('America/Guatemala').format('YYYY-MM-DD')
    
    const correlative = await generateCorrelative(connection,storage.getCorrelative())
    console.log(correlative,'tt')

    await connection.beginTransaction()
    // header invoice
    const [create] = await connection.execute(storage.post(data, date, correlative))
    
    if(!create)
      throw Error('Error creating Header Invoices')
    
    data.transaction_number = create.insertId

    //build XML
    const xml_form = buildXML(data, moment)
  
    ///return response(200, xml_form, connection)
  
    let invoiceData = {
      Cliente: process.env['CLIENT_FACT_DEV'],
      Usuario:process.env['USER_FACT_DEV'],
      Clave: process.env['PASSWORD_FACT_DEV_ID'],
      Nitemisor: process.env['NIT_FACT_DEV'],
      Xmldoc: xml_form
    }
    const log = await connection.execute(storage.saveToLog(invoiceData, date,create.insertId))
    if(!log[0].insertId)
      throw Error('Error creating log')
    
    const xml_response = await storage.makeRequestSoap(SOAP, process.env['URL_DEV_FACT'], invoiceData)
    //console.log(xml_response,'ll')
    const json = await storage.parseToJson(xml_response.Respuesta, xml2js,date)
    
    if(json.Errores)
      throw Error(JSON.stringify(json.Errores.Error))
    
    const date_download = moment().tz('America/Guatemala').format('YYYY-MM-DD')
    //create detail
    if(create.affectedRows > 0 ){
      await Promise.all(data.items.map(async (x) => {
        let detail = await connection.execute(storage.createDetail(x,create.insertId))        
        //download to Inventory
        if(x.package_id) await connection.execute(storage.downloadSimple(date_download,x.package_id))
        return detail
      }));
   }
        
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
    
    await connection.execute(storage.updatedToLog(serializerResponse, date,create.insertId))
    await connection.execute(storage.updatedDocument(serializerResponse, create.insertId))
    //create account
    await connection.execute(storage.createReconciliation(create.insertId, date))

    await connection.commit()
  
    if(serializerResponse.error)
      throw new Error(JSON.stringify(serializerResponse.error))
    
    delete serializerResponse.pdf
    delete serializerResponse.xml
 
    return response(200, serializerResponse, connection)
  } catch (e) {
    console.log(e)
    await connection.rollback()
    await connection.end()
    return response(400, e.message, null)
  }
}

module.exports.documents = async (event) => {
  try {
    let params = {
      id:null,
      type:null
    }
    
    if (event.queryStringParameters && event.queryStringParameters.type) {
      params.type = event.queryStringParameters.type
    }
  
    if (event.queryStringParameters && event.queryStringParameters.id) {
      params.id = event.queryStringParameters.id
    }
    
    const connection = await mysql.createConnection(dbConfig)
    
    const [documents] =  await connection.execute(storage.get(params))
  
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
    
    if(documents.length === 0)
      throw Error('This client does not have packages to generate an Invoice')
    
    const [client_info] =  await connection.execute(storage.getClientInfo(client))
    
    const [services] = await connection.execute(storage.products())
    
    let data = {
      packages : documents,
      client : client_info[0],
      services: services
    }
    
    return response(200, data, connection)
  }catch (e) {
    return response(400, e.message, null)
  }
}

module.exports.annul = async (event) => {
  try {
    
    let data = JSON.parse(event.body)
    //id document
    const id = event.pathParameters && event.pathParameters.id ? event.pathParameters.id : undefined
    const validation = storage.isEmpty(data)
    if ( validation ) throw `missing_parameter. ${validation}`
    
    const connection = await mysql.createConnection(dbConfig)
    const date = moment().tz('America/Guatemala').format('YYYY-MM-DD')
    const [documents] =  await connection.execute(storage.getDetail(id))
    
    if(documents.length === 0 ||  !documents[0].num_authorization_sat)
      throw new Error (`Error the autorization number is required`)
    
    
    let invoiceData = {
      Cliente: process.env['CLIENT_FACT_DEV'],
      Usuario:process.env['USER_FACT_DEV'],
      Clave: process.env['PASSWORD_FACT_DEV_ID'],
      Nitemisor: process.env['NIT_FACT_DEV'],
      Numautorizacionuuid: documents[0].num_authorization_sat,
      Motivoanulacion: data.reason
    }
  
    console.log(invoiceData, 'sending data to annul')
    
    const xml_response = await storage.makeRequestSoap(SOAP, process.env['URL_DEV_FACT_CANCEL'], invoiceData)
    if(xml_response.Fault) throw new Error (`${xml_response.Fault.faultstring}`)
    const json = await storage.parseToJson(xml_response.Respuesta, xml2js)
  
    if(json.Errores)
      throw Error(JSON.stringify(json.Errores.Error))
    
    await connection.execute(storage.invoiceAnnul(data,date,id))
    
    let serializerResponse = {
      create_at: json.DTE ? json.DTE.FechaAnulacion[0] : null,
      certification_date: json.DTE.FechaCertificacion ? json.DTE.FechaCertificacion[0] : null,
      error: json.DTE.Error ? json.DTE.Error[0] : null,
      pdf: json.DTE.Pdf[0],
      xml: json.DTE.Xml[0]
    }
  
    await connection.execute(storage.updatedToLog(serializerResponse, date,id))

    await connection.execute(storage.revertPackage(id))
    
    delete serializerResponse.pdf
    delete serializerResponse.xml
    
    return response(200, serializerResponse, connection)
  } catch (e) {
    console.log(e)
    return response(400, e.message, null)
  }
}

module.exports.payments = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig)
    
    const [documents] =  await connection.execute(storage.payments())
    
    return response(200, documents, connection)
  }catch (e) {
    return response(400, e.message, null)
  }
}

/// Accounts reconciliation Section

module.exports.updateReconciliation = async (event) => {
  
  try{
    let data = JSON.parse(event.body)
    
    const validation = storage.isEmpty(data)
    if ( validation ) throw `missing_parameter. ${validation}`
    
    const id = event.pathParameters && event.pathParameters.id ? event.pathParameters.id : undefined
    
    const connection = await mysql.createConnection(dbConfig)
    
    const date = moment().tz('America/Guatemala').format('YYYY-MM-DD')
    
    const [update] = await connection.execute(storage.updateReconciliation(data, id, date))
    
    if(!update)
      throw Error('Error creating the record')
    
    return response(200, update, connection)
    
  }catch (e) {
    console.log(e)
    return response(400, e.message, null)
  }
}

module.exports.reconciliation = async (event) => {
  try{
    
    let params = {
      id:null,
      type:null
    }
  
    if (event.queryStringParameters && event.queryStringParameters.type) {
      params.type = event.queryStringParameters.type
    }
  
    if (event.queryStringParameters && event.queryStringParameters.id) {
      params.id = event.queryStringParameters.id
    }
    if(params.type === 'date'){
      
      const date = moment(params.id).format('YYYY-MM-DD 00:00:00')
      
      params.start = date
      params.end = moment(date).format('YYYY-MM-DD 23:59:99')
    }
    const connection = await mysql.createConnection(dbConfig)
    const [accounts] = await connection.execute(storage.getReconciliation(params))
    return response(200, accounts, connection)
  }catch (e) {
    console.log(e)
    return response(400, e.message, null)
  }
}







