'use strict'
const mysql = require('mysql2/promise')
const isOffline = process.env['IS_OFFLINE']
const { dbConfig } = require(`${isOffline ? '../..' : '.'}/commons/dbConfig`)
const { response, fileResponse, getBody, escapeFields } = require(`${isOffline ? '../..' : '.'}/commons/utils`)
const storage = require('./manifestStorage')

const AWS = require('aws-sdk')
const Excel = require('exceljs')
AWS.config.update({ region: 'us-east-1' })

module.exports.readManifest = async (event, context) => {
  const connection = await mysql.createConnection(dbConfig)
  try {
    const status = event.queryStringParameters && event.queryStringParameters.status ? event.queryStringParameters.status : undefined

    const [manifests] = await connection.execute(storage.readManifest(status))

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
    const id = event.pathParameters && event.pathParameters.id ? JSON.parse(event.pathParameters.id) : undefined
    const requiredFields = ['description', 'status']
    const body = escapeFields(getBody(event))
    const errorFields = requiredFields.filter(k => !body[k])

    if (errorFields.length > 0) {
      throw new Error(`The fields ${errorFields.join(', ')} are required`)
    }

    const [manifest] = await connection.execute(storage.updateManifest(body, id))

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

module.exports.readPackagesByManifest = async event => {
  const connection = await mysql.createConnection(dbConfig)
  try {
    const manifest_id = event.pathParameters && event.pathParameters.id ? JSON.parse(event.pathParameters.id) : undefined

    let [result] = await connection.execute(storage.getPackagesByManifestId(manifest_id))

    return response(200, result, connection)
  } catch (error) {
    const message = error.message ? error.message : error

    return await response(400, { error: message }, connection)
  }
}

module.exports.exportManifest = async event => {
  const connection = await mysql.createConnection(dbConfig)
  try {
    const manifest_id = event.pathParameters && event.pathParameters.id ? JSON.parse(event.pathParameters.id) : undefined

    let [result] = await connection.execute(storage.getPackagesByManifestId(manifest_id))
    let report
    let file

    console.log('result ', result)

    let manifestoHeaders = [
      { name: 'Tracking', column: 'tracking', width: 33.5 },
      { name: 'WareHouse', column: 'warehouse', width: 9.83 }, //Missing
      { name: 'Proveedor', column: 'supplier_name', width: 15 },
      { name: 'Consignatario', column: 'client_name', width: 43.33 },
      { name: 'Piezas', column: 'Piezas', width: 6 }, //Missing
      { name: 'Peso Kg', column: 'weight', width: 6.33 },
      { name: 'Valor Flete', column: 'ValorFlete', width: 15 }, //Missing
      { name: 'Descripcion', column: 'description', width: 51.5 },
      {
        name: 'Valor Declarado',
        column: 'costo_producto',
        width: 16.17,
        numFmt: '"$"#,##0.00',
      }, //Missing
    ]

    let weightHeaders = [
      { name: 'TULA', column: 'tula', width: 18 },
      { name: 'PESOS', column: 'pesos', width: 18 },
    ]

    report = await standardReport({
      sheets: [
        {
          name: `MANIFIESTO`,
          headers: manifestoHeaders,
          data: result,
        },
        {
          name: 'PESOS',
          headers: weightHeaders,
          data: [],
        },
      ],
    })

    file = await report.xlsx.writeBuffer()

    return await fileResponse(200, file.toString('base64'), connection, manifest_id)
  } catch (error) {
    const message = error.message ? error.message : error

    return await response(400, { error: message }, connection)
  }
}

const standardReport = data =>
  new Promise((resolve, reject) => {
    let workbook = new Excel.Workbook()
    workbook.creator = 'TraesTodo'
    workbook.created = new Date()

    let auxCol = null

    if (data && data.sheets && data.sheets.length > 0) {
      data.sheets.forEach((sheet, i) => {
        let newSheet = workbook.addWorksheet(sheet.name, {
          headerFooter: {
            firstHeader: 'Hello Exceljs',
            firstFooter: 'Hello World',
          },
        })

        newSheet.columns = sheet.headers.map(header => ({
          header: header.name,
          key: header.column,
          width: header.width || 15,
        }))

        newSheet.getRow(1).font = { bold: true, color: { argb: 'ffffff' } }

        newSheet.getRow(1).alignment = { wrapText: true }

        newSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '053E81' },
        }

        newSheet.addRows(sheet.data.map(d => d))

        sheet.headers.forEach((h, c) => {
          if (h.formula) {
            auxCol = newSheet.getColumn(h.column)
            auxCol.eachCell((cell, i) => {
              if (i > 1) {
                cell.value = { formula: h.formula.replace(/#/g, i) }
              }
            })
          }

          if (h.numFmt) {
            newSheet.getColumn(h.column).numFmt = h.numFmt
          }
        })

        if (sheet.totals && sheet.totals.length > 0) {
          sheet.totals.forEach(t => {
            newSheet.getCell(`${t}${sheet.data.length + 2}`).value = {
              formula: `SUM(${t}2:${t}${sheet.data.length + 1})`,
            }
            newSheet.getCell(`${t}${sheet.data.length + 2}`).font = {
              bold: true,
            }
          })
        }
        if (sheet.individualCells && sheet.individualCells.length > 0) {
          sheet.individualCells.forEach(cell => {
            newSheet.getCell(`${cell.name}`).value = cell.value ? cell.value : { formula: `${cell.formula}` }
            newSheet.getCell(`${cell.name}`).font = { bold: cell.bold }
          })
        }
      })
    }

    resolve(workbook)
  })
