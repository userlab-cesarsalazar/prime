const Base64 = require("base-64");
const request = require("request");

module.exports.openSession = async () => {
  const credential = Base64.encode(
    process.env["TIGO_USER"] + ":" + process.env["TIGO_PASSWORD"]
  );
  const options = {
    method: "POST",
    url:
      "https://prod.api.tigo.com/oauth/client_credential/accesstoken?grant_type=client_credentials",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credential}`,
    },
  };
  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (error) reject(error);
      console.log(response.body);
      resolve(JSON.parse(response.body));
    });
  });
};
