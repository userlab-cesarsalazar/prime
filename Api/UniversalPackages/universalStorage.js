const read = (tracking) => {
  const query = `SELECT * FROM paquetes A
                 WHERE A.tracking = '${tracking.trackingNumber}'
                 ORDER BY A.package_id`
  
  return query
}

const create = (params,date) => {
  const query = `INSERT INTO packages_universe (tracking, created_date, carrier_id, status) VALUES('${params.tracking}', '${date}', ${params.carrier}, 'ACTIVE');`
  console.log(query);
  return query
}

module.exports = {
  get: read,
  post: create
}
