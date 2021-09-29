"use strict";
const mysql = require("mysql2/promise");
const moment = require("moment-timezone");
const isOffline = process.env["IS_OFFLINE"];
const { dbConfig } = require(`${isOffline ? "../.." : "."}/commons/dbConfig`);
let { response } = require(`${isOffline ? "../.." : "."}/commons/utils`);
let storage = require("./universalStorage");
const date = moment().tz("America/Guatemala").format("YYYY-MM-DD");
const request = require(process.env["IS_OFFLINE"]
  ? "request"
  : "../../layers/nodejs/node_modules/request");

const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });

module.exports.read = async (event, context) => {
  try {
    let params = {}
    
    if(event.pathParameters.tracking)
      params.trackingNumber = event.pathParameters.tracking
    
    let api24 = await new Promise((resolve, reject) => {
      request.post({
        headers: {
          'content-type': 'application/json',
          'Authorization': process.env['TOKEN_24API']
        },
        url: process.env['URL_24API'],
        body: params,
        json:true
      }, function(error, response, body){
        if(error)
          reject(error)
        resolve(body)
      });
    })
    
    const connection = await mysql.createConnection(dbConfig)
    let [packages] = await connection.execute(storage.get(params))
    
    if(packages.length > 0 ){
      packages.forEach(x => {
        if(x.ing_date){
          x.ing_date = new Date(x.ing_date)
        }
      })
    }
    
    let data = {
      warehouse: packages,
      api24: {...api24},
      
    }

    return response(200, data, connection)
  } catch (e) {
    console.log(e, "catch");
    return response(400, e, null);
  }
};

module.exports.createTicket = async (event, context) => {
  try {

    let body = JSON.parse(event.body);

    body = {
      assignedTo: parseInt(process.env.ASSIGNED_TO),
      inboxId: parseInt(process.env.INBOX_ID),
      ...body,
    }

    let option = {
      method: "post",
      url: process.env.TEAMWORK_URL,
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${process.env.TEAMWORK_TOKEN}`,
      },
    };

    const promise = await new Promise((resolve, reject) => {
      request(option, (error, result, body) => {
        if (error) {
          console.log(error);
          reject(error);
        }
        console.log(body, result);
        resolve(body);
      });
    });

    return response(200, promise, null);

  } catch (error) {
    throw error;
  }
};
