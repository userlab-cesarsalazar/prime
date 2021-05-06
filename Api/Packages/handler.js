"use strict";
const mysql = require("mysql2/promise");
const moment = require("moment-timezone");
const isOffline = process.env["IS_OFFLINE"];
const { dbConfig } = require(`${isOffline ? "../.." : "."}/commons/dbConfig`);
let { response, notifyEmail } = require(`${
  isOffline ? "../.." : "."
}/commons/utils`);
let storage = require("./packageStorage");
const request = require("request");
const date = moment().tz("America/Guatemala").format("YYYY-MM-DD");
const { openSession } = require("./functions");

const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const sns = new AWS.SNS();

module.exports.read = async (event, context) => {
  try {
    let page = 0;
    let type = null;
    let id = null;

    if (event.queryStringParameters && event.queryStringParameters.page) {
      page = event.queryStringParameters.page;
    }

    if (event.queryStringParameters && event.queryStringParameters.type) {
      type = event.queryStringParameters.type;
    }

    if (event.queryStringParameters && event.queryStringParameters.id) {
      id = event.queryStringParameters.id;
    }

    const connection = await mysql.createConnection(dbConfig);
    const [packages] = await connection.execute(storage.get(page, type, id));

    return response(200, packages, connection);
  } catch (e) {
    console.log(e, "catch");
    return response(400, e, null);
  }
};

module.exports.detail = async (event, context) => {
  try {
    console.log(event.pathParameter, "event.pathParameter");
    const package_id =
      event.pathParameters && event.pathParameters.package_id
        ? JSON.parse(event.pathParameters.package_id)
        : undefined;

    if (package_id === undefined) throw "pathParameters missing";

    let connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute(storage.getByid(package_id));
    return response(200, users, connection);
  } catch (e) {
    return response(400, e, null);
  }
};

module.exports.create = async (event, context) => {
  try {
    let data = JSON.parse(event.body);
    if (!data.tracking || !data.client_id || !data.weight || !data.description)
      throw "missing_parameter.";

    data.ing_date = date;

    let connection = await mysql.createConnection(dbConfig);

    const [checkPackage] = await connection.execute(
      storage.findByTracking(data)
    );
    if (checkPackage.length > 0) {
      console.log("update", data);
      //update
      const [update] = await connection.execute(
        storage.put(checkPackage[0], data, date, null)
      );
      if (update)
        await connection.execute(
          storage.postDetail(data, checkPackage[0].package_id, date)
        );
    } else {
      console.log("create", data);
      //create
      const [save] = await connection.execute(storage.post(data));
      if (save)
        await connection.execute(storage.postDetail(data, save.insertId, date));
    }

    const [userData] = await connection.execute(
      storage.getUserInfo(data.client_id)
    );

    if (!data.status || data.status !== "Registrado") {
      let template = prepareToSend(data, userData);
      const validate = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (validate.test(String(userData[0].email).toLowerCase())) {
        //await notifyEmail(AWS, template)
      }

      let payload = {
        profile: userData,
        data: data,
      };
      const params = {
        Message: JSON.stringify(payload),
        TopicArn: `arn:aws:sns:us-east-1:${process.env["ACCOUNT_ID"]}:sms-${process.env["STAGE"]}-tigo`,
      };

      await new Promise((resolve, reject) => {
        sns.publish(params, (error) => {
          if (error) {
            console.log("SNS error ", error);
            reject(error);
          } else {
            console.log("added");
            resolve("added");
          }
        });
      });
    }

    return response(200, data, connection);
  } catch (e) {
    console.log(e);
    return response(400, e, null);
  }
};

module.exports.update = async (event, context) => {
  try {
    const package_id =
      event.pathParameters && event.pathParameters.package_id
        ? JSON.parse(event.pathParameters.package_id)
        : undefined;

    const download =
      event.queryStringParameters && event.queryStringParameters.download
        ? JSON.parse(event.queryStringParameters.download)
        : undefined;

    if (package_id === undefined) throw "pathParameters missing";

    let data = JSON.parse(event.body);

    if (!data) throw "no data to update";

    const connection = await mysql.createConnection(dbConfig);

    /* Status
     * En Transito
     * Listo para Entrega en Domicilio
     * Recoger en Traestodo
     * Entregado
     * Entregado con saldo pendiente
     * */
    if (download) {
      const update = await connection.execute(
        storage.downloadSimple(date, package_id)
      );
    } else {
      console.log("2");
      const update = await connection.execute(
        storage.updateStatus(data, package_id, date, data.status)
      );
    }

    //if (update && data.status === 'Entregado con saldo pendiente') {
    const today = moment()
      .tz("America/Guatemala")
      .format("YYYY-MM-DD hh:mm:ss");
    await connection.execute(storage.saveRemaining(data, today));
    //}

    return response(200, data, connection);
  } catch (e) {
    console.log(e, "t");
    return response(400, e, null);
  }
};

module.exports.delete = async (event, context) => {
  try {
    const package_id =
      event.pathParameters && event.pathParameters.package_id
        ? JSON.parse(event.pathParameters.package_id)
        : undefined;

    if (package_id === undefined) throw "pathParameters missing";

    const connection = await mysql.createConnection(dbConfig);

    const update = await connection.execute(storage.delete(package_id));

    return response(200, update, connection);
  } catch (e) {
    return response(400, e, null);
  }
};

module.exports.updateStatus = async (event, context) => {
  try {
    let data = {};

    const package_id =
      event.pathParameters && event.pathParameters.package_id
        ? JSON.parse(event.pathParameters.package_id)
        : undefined;

    if (event.queryStringParameters && event.queryStringParameters.status) {
      data.status_detail = event.queryStringParameters.status;
    }

    const date = moment().tz("America/Guatemala").format("YYYY-MM-DD hh:mm:ss");

    const connection = await mysql.createConnection(dbConfig);
    const [packages] = await connection.execute(
      storage.postDetail(data, package_id, date)
    );

    return response(200, packages, connection);
  } catch (e) {
    console.log(e, "catch");
    return response(400, e, null);
  }
};

module.exports.transfer = async (event, context) => {
  try {
    let data = JSON.parse(event.body);

    let connection = await mysql.createConnection(dbConfig);

    const [checkPackage] = await connection.execute(storage.transfer(data));

    const [log] = await connection.execute(storage.logPackage(data));

    return response(200, checkPackage, connection);
  } catch (e) {
    console.log(e, "error");
    return response(200, e, null);
  }
};

module.exports.transferClient = async (event, context) => {
  try {
    let data = JSON.parse(event.body);
    let connection = await mysql.createConnection(dbConfig);

    const [checkClients] = await connection.execute(
      storage.checkClient(data.client_id.toUpperCase())
    );

    if (checkClients.length === 0) {
      connection.end();
      throw Error("El codigo cliente no existe.");
    }

    const [checkNewCode] = await connection.execute(
      storage.checkClient(data.new_client_id.toUpperCase())
    );

    if (checkNewCode.length > 0) {
      connection.end();
      throw Error("El nuevo codigo existe asociado a otro client");
    }
    //update
    await connection.execute(storage.updateClient(data));
    await connection.execute(storage.updateClientPackages(data));
    const [log] = await connection.execute(storage.logPackage(data));

    return response(200, checkClients, connection);
  } catch (e) {
    console.log(e, "error");
    return response(400, e.message, null);
  }
};

function prepareToSend(user, profile) {
  let MSG = ``;
  if (user.client_id.charAt(0) === "P") {
    MSG = `<p><br />Queríamos informarle que ya tenemos un paquete listo en nuestras oficinas, puede ser enviado a domicilio o entregado en nuestras oficinas, los datos del paquete son los siguientes:<br />
                <div>
                  Tracking: ${user.tracking} <br />
                  Peso en Lbs: ${user.weight} <br />
                <div>
                </p>
                Nuestro horario de atención es de Lunes a Viernes de 9:00 a 18:00 horas, y nuestra dirección es:
                 5 Avenida 16-28 Local D, Zona 10 Guatemala, CA.
                 Envíanos un correo a : info@primenowcourier.com si quieres que te enviemos tu paquete a domicilio o llamanos Telefonos: 22193432 - 33481631 <br /> `;
  } else {
    MSG = `<p><br />Le informamos que se ha recibido  un paquete en su casillero y se encuentra disponivoe en Guatemala, los datos del paquete son los siguientes:<br />
                <div>
                  Tracking: ${user.tracking} <br />
                  Peso en Lbs: ${user.weight} <br />
                <div>
                </p>
                Para coordinación de entrega comunicarse a el número 5803-2545 o correo eléctrico Info@rapiditoexpress.com <br /> `;
  }

  const template = {
    mailList: [profile[0].email],
    from: "info@primenowcourier.com",
    subject: `Paquete listo para entrega!!`,
    bcc: ["cesar.augs@gmail.com"],
    body: {
      Html: {
        Charset: "UTF-8",
        Data: MSG,
      },
    },
  };
  return template;
}

module.exports.sendPrime = async (event) => {
  try {
    const uuidv1 = require("uuid/v1");
    const id = uuidv1();

    let params = event.body
      ? typeof event.body === "string"
        ? JSON.parse(event.body)
        : event.body
      : event.Records
      ? JSON.parse(event.Records[0].Sns.Message)
      : null;

    console.log(params);
    //subir codigo de los mensajes.
    if (!params) throw "no_params";

    let SMS = "";

    switch (params.data.client_id.charAt(0)) {
      case "P":
        SMS = `NOW EXPRESS informa que tiene un paquete con tracking ${params.data.tracking}, Cliente: ${params.data.client_id}, Total: ${params.data.total}  en nuestras oficinas. Contactenos al telefono 2376-4699 / 3237-0023`;
        break;
      case "T":
        SMS = `TRAESTODO informa que tiene un paquete con tracking ${params.data.tracking}, Cliente: ${params.data.client_id}, LBs: ${params.data.weight} . Para coordinación de entrega comunicarse al 4154-4275`;
        break;
      default:
        SMS = `Rapidito Express informa que tiene un paquete con tracking ${params.data.tracking}, Cliente: ${params.data.client_id}, LBs: ${params.data.weight} . Para coordinación de entrega comunicarse al 5803-2545 o email: Info@rapiditoexpress.com`;
    }

    const phone = `502${params.profile[0].phone}`;

    let URL = `https://comunicador.tigo.com.gt/api/http/send_to_contact?msisdn=${phone}&message=${SMS}&api_key=${process.env["API_KEY_TIGO"]}&id=${id}`;

    return new Promise((resolve, reject) => {
      request(
        {
          url: URL,
          method: "GET",
          headers: {
            "content-type": "application/json",
          },
          json: true,
        },
        function (error, result, body) {
          console.log(body, "body");
          if (error) reject(error);
          resolve(body);
        }
      );
    });
  } catch (e) {
    console.log(e, "catch");
    return response(400, e, null);
  }
};

module.exports.sendSMSTigo = async (event) => {
  try {
    let params = event.body
      ? typeof event.body === "string"
        ? JSON.parse(event.body)
        : event.body
      : event.Records
      ? JSON.parse(event.Records[0].Sns.Message)
      : null;

    const session = await openSession();

    if (!session.access_token) throw Error("Api de tigo no responde");

    console.log(params, "params");

    //subir codigo de los mensajes.
    if (!params) throw "no_params";

    let SMS = "";

    switch (params.data.client_id.charAt(0)) {
      case "P":
        SMS = `NOW EXPRESS informa que tiene un paquete con tracking ${params.data.tracking}, Cliente: ${params.data.client_id}, Total: ${params.data.total}. Contactenos al telefono 2376-4699 / 3237-0023`;
        break;
      case "T":
        SMS = `TRAESTODO informa que tiene un paquete con tracking ${params.data.tracking}, Cliente: ${params.data.client_id}, LBs: ${params.data.weight}. Comunicarse al 4154-4275`;
        break;
      default:
        SMS = `Rapidito Express informa que tiene un paquete con tracking ${params.data.tracking}, Cliente: ${params.data.client_id}, LBs: ${params.data.weight}. Comunicarse al 5803-2545 o email: Info@rapiditoexpress.com`;
    }

    const phone = `502${params.profile[0].phone}`;

    var options = {
      method: "POST",
      url: process.env["URL_TIGO"],
      headers: {
        "Content-Type": "application/json",
        APIKey: process.env["TIGO_API_KEY"],
        APISecret: process.env["TIGO_SECRET_KEY"],
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        protocol: "sms",
        shortcodeId: "NowExpres",
        shortcodeType: "pretty_code",
        msisdn: phone,
        priority: 0,
        body: SMS,
      }),
    };
    let P = await new Promise((resolve, reject) => {
      request(options, function (error, response) {
        if (error) reject(error);
        console.log(response.body);
        resolve(response.body);
      });
    });
    return response(200, P, null);
  } catch (e) {
    console.log(e, "catch");
    return response(400, e, null);
  }
};

module.exports.sesTopic = async (event, context) => {
  try {
    console.log(event, "check event");
    return response(200, event, null);
  } catch (e) {
    console.log(e, "error");
    return response(400, e, null);
  }
};

module.exports.guides = async (event, context) => {
  try {
    let data = JSON.parse(event.body);
    if (!data.master || !data.poliza) throw "missing_parameter";

    data.date_created = date;

    let connection = await mysql.createConnection(dbConfig);
    //status [ACTIVE,CLOSED]
    const [checkCuide] = await connection.execute(storage.checkGuide(data));
    console.log(checkCuide, "checkCuide");

    if (checkCuide.length === 0) {
      const [save] = await connection.execute(storage.postGuide(data));
    }

    return response(200, data, connection);
  } catch (e) {
    console.log(e);
    return response(400, e, null);
  }
};

module.exports.getGuides = async (event, context) => {
  try {
    let connection = await mysql.createConnection(dbConfig);
    const [guides] = await connection.execute(storage.getGuides());

    return response(200, guides, connection);
  } catch (e) {
    console.log(e);
    return response(400, e, null);
  }
};

module.exports.getGuidesOpen = async (event, context) => {
  try {
    let connection = await mysql.createConnection(dbConfig);
    const [guides] = await connection.execute(storage.getGuidesOpens());

    return response(200, guides, connection);
  } catch (e) {
    console.log(e);
    return response(400, e, null);
  }
};

module.exports.closeGuides = async (event, context) => {
  try {
    console.log(event.queryStringParameters, "queryStringParameters");
    const data = {
      master:
        event.queryStringParameters && event.queryStringParameters.master
          ? event.queryStringParameters.master
          : undefined,
      poliza:
        event.queryStringParameters && event.queryStringParameters.poliza
          ? event.queryStringParameters.poliza
          : undefined,
    };

    if (data.master === undefined) throw "pathParameters missing";

    const date_closed = date;

    let connection = await mysql.createConnection(dbConfig);
    //status [ACTIVE,CLOSED]
    const [checkCuide] = await connection.execute(
      storage.closeGuide(data, date_closed)
    );

    return response(200, checkCuide, connection);
  } catch (e) {
    console.log(e);
    return response(400, e, null);
  }
};
