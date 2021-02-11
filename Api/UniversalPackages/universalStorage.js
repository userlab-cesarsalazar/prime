const read = (params) => {
  let _limit = 25
  let _page = 0
  
  if (params.page && params.page > 1) {
    _page = (params.page - 1) * _limit
  } else {
    _page = 0
  }
  
  const query = `SELECT * FROM packages_universe A
                 ${peprareData(params)}
                 ORDER BY id DESC LIMIT ${_page},${_limit}`
  console.log(query);
  return query
}

const create = (params,date) => {
  const query = `INSERT INTO packages_universe (tracking, created_date, carrier_id, status) VALUES('${params.tracking}', '${date}', ${params.carrier}, 'ACTIVE');`
  console.log(query);
  return query
}

const peprareData = (params) => {
  let where = ''
  if(params.tracking && params.tracking !== ''){
    where += where === '' ? `WHERE tracking like '%${params.tracking}%'`:` AND tracking like '%${params.tracking}%'`
  }
  
  if(params.date && params.date !== ''){
    where += where === '' ? `WHERE created_date = '${params.date}'`:` AND created_date = '${params.date}'`
  }
  
  if(params.carrier && params.carrier !== ''){
    where += where === '' ? `WHERE carrier_id = ${params.carrier}`:` AND carrier_id = ${params.carrier}`
  }
  return where
}
module.exports = {
  get: read,
  post: create
}
