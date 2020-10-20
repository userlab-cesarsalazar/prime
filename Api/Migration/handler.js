'use strict'
const mysql = require('mysql2/promise')
const isOffline = process.env['IS_OFFLINE']
const { dbConfig } = require(`${isOffline ? '../..' : '.'}/commons/dbConfig`)
let { response } = require(`${isOffline ? '../..' : '.'}/commons/utils`)
let storage = require('./storage')

let rapiditoDbConfig = {
  host: "traestodo.chnl5zdik5fi.us-east-1.rds.amazonaws.com",
  port: "3306",
  password:  "W3qgJ8gy7fcAdZJTD39r",
  user: "administrattor",
  database: "rapidito",
}

/**
 * ALTER TABLE clientes ADD COLUMN reference_id varchar(10);
 * */


module.exports.fixIds = async (event) => {
  try {
    
  const connection = await mysql.createConnection(dbConfig)
  let [users] = await connection.execute(storage.oldIdUsers())
  for (let i = 0; i<users.length; i++) {
    console.log(`Processing ${(i+1)} of ${users.length}`)
    
    let currentUser = users[i]    
    let newId = await generateID(connection)
    console.log(`From ${currentUser.client_id} to ${newId}` )
    await connection.execute(storage.updateUserId(currentUser.client_id, newId))
    await connection.execute(storage.updateTransactions(currentUser.client_id, newId))
  }
  return response(200, { message:'success' }, connection)
  } catch(e) {
    console.log(e)
    return response(400, {message: 'Error'}, null)
  }
}

module.exports.migrateUsers = async (event) => {
  try {

    const connection = await mysql.createConnection(dbConfig)
    const connectionrapidito = await mysql.createConnection(rapiditoDbConfig)
    let [users] = await connection.execute(storage.getcurrentUsersMails())
    let mails = users.map(e => `'${e.email}'`).join(',')

   let [userRapitido] = await connectionrapidito.execute(storage.migrateNewUsers(mails))
console.log(userRapitido.length)
userRapitido.map(e => console.log(e.client_name, ";" ,e.email))
   let insertUsers = storage.insertUsers(userRapitido)  
   console.log("insert users", insertUsers)
   await connection.execute(insertUsers)
   console.log("inser users!")
   let userForInsert = []
   let insertClients = ""
   for (let i=0; i< userRapitido.length; i++){
    if (userForInsert.length < 500) {
      userForInsert.push(userRapitido[i])
    } else {
      insertClients = storage.insertClients(userForInsert)
      console.log(insertClients)
      await connection.execute(insertClients)    
      userForInsert = []
    }
   }

   if (userForInsert.length >0) {
    insertClients = storage.insertClients(userForInsert)
    console.log(insertClients)
    await connection.execute(insertClients)    
   }
   console.log("inser clients!")
  
   return response(200, { message:'success' }, connection)
  } catch(e) {
    console.log(e)
    return response(400, {message: 'Error'}, null)
  }
}


const generateID = async (connection) => {
  try {
    let [client_id] = await connection.execute(storage.findMaxId())
    //save the initial
    console.log(client_id,'client_id')
    let initial = client_id[0].client_id[0]
    let secondPart = client_id[0].client_id.replace(/[A-Z]/g,'').length
    let maximum = parseInt(client_id[0].client_id.replace(/[A-Z]/g,'')) + 1
    let partNumeric = maximum.toString().length
    partNumeric = secondPart - partNumeric
    let _client = ''
    let _var = ''
    for (let i = 0 ; i < partNumeric; i++ ){
      _var += `0`
      _client = `${initial}${_var}${maximum}`
    }
    return _client
  }catch (e) {
    console.log(e,'ee')
  }
}