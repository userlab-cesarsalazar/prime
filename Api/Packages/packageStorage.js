const read = (page, type, id) => {
  let _limit = 25
  let _page = 0
  let where = ''

  if (page && page > 1) {
    _page = (page - 1) * _limit
  } else {
    _page = 0
  }
  switch (type) {
    case 'tracking':
      where = `WHERE tracking like '%${id}%'`
      break
    case 'client_id':
      where = `WHERE A.client_id = '${id}'`
      _limit = 1000
      break
    case 'package_id':
      where = `WHERE A.package_id = ${parseInt(id, 10)}`
      _limit = 1000
      break
    case 'phone':
      where = `WHERE C.phone like '%${id}%'`
      _limit = 1000
      break
    case 'guide':
      where = `WHERE A.guia = '${id}'`
      _limit = 1000
      break
  }

  const query = `SELECT A.package_id, A.client_id, A.tracking, A.total_a_pagar, A.description, C.contact_name, A.ing_date, A.ent_date, A.status,
                 A.weight, A.anticipo, A.total_a_pagar, A.dai, A.cif, A.importe, A.costo_producto, A.tasa, A.guia, A.total_iva, A.poliza
                FROM  paquetes A
                LEFT JOIN clientes C on A.client_id = C.client_id
                ${where}
                ORDER BY A.package_id DESC LIMIT ${_page},${_limit}`

  return query
}

const detail = package_id => {
  const query = `SELECT A.package_id, A.client_id, A.tracking, A.total_a_pagar, A.description,
                 C.contact_name, A.ing_date, A.ent_date, A.status, C.main_address, C.entrega,
                 A.entregado, A.delivery, A.cancelado, A.weight, A.anticipo, A.total_a_pagar,
                 A.dai, A.cif, A.importe, A.costo_producto, A.tasa, A.guia, A.total_iva, A.poliza
                 FROM paquetes A
                 LEFT JOIN paquetes_detail B on A.package_id = B.package_id
                 LEFT JOIN clientes C on A.client_id = C.client_id
                 WHERE A.package_id = ${package_id}`
  return query
}

const create = data => {
  let status = 'Recoger en Prime'
  if (data.status) {
    status = data.status
  }

  if (data.entrega === 'Entrega a Domicilio') {
    status = 'Listo para Entrega a Domicilio'
  }
  
  const query = `INSERT INTO paquetes (tracking, client_id, weight, description, category_id, total_a_pagar, ing_date ,status,
                entregado, cancelado, delivery, create_by, costo_producto, dai, cif, importe, master, poliza, guia, tasa, total_iva)
                  VALUES ('${data.tracking}',
                  '${data.client_id}',
                  '${data.weight}',
                  '${data.description}',                  
                  ${data.category_id ? data.category_id : 1},
                  ${data.total},
                  '${data.ing_date}',
                  '${status}',
                  0,0,0,'NEW_SYSTEM',${data.cost ? data.cost : 0},
                  ${data.dai ? data.dai : 0.00 },
                  ${data.cif ? data.cif: 0.00},
                  ${data.importe ? data.importe : 0.00 },
                  '${data.pn_master.master ? data.pn_master.master  : '' }',
                  '${data.pn_master.poliza ? data.pn_master.poliza : '' }',
                  '${data.guia ? data.guia : ''}',
                  ${data.tasa ? data.tasa : 0.00},
                  ${data.iva ? data.iva : 0.00})`
  
  return query
}

const createDetail = (data, package_id, date, status) => {
  let updateStatus = 3
  if (status === 'Entregado' || status === 'Entregado') {
    updateStatus = 4
  }

  const query = `INSERT INTO paquetes_detail (package_id, status, fecha_registro, client_id, tba)
                  VALUES (${package_id},${updateStatus},'${date}','${data.client_id}',0)`
  return query
}

const update = (checkPackage, data, date) => {
  let status = 'Recoger en Prime'

  if (checkPackage.entrega === 'Entrega a Domicilio') {
    status = 'Listo para Entrega a Domicilio'
  }
  
  const query = `UPDATE paquetes SET weight = '${data.weight}',
                  description = '${data.description}',
                  status = '${status}',
                  total_a_pagar = ${data.total},
                  ing_date = '${date}',
                  category_id = ${data.category_id},
                  costo_producto = ${data.cost},
                  dai = ${data.dai},
                  cif = ${data.cif},
                  importe = ${data.importe},
                  master = '${data.pn_master.master}',
                  poliza = '${data.pn_master.poliza}',
                  guia = '${data.guia}',
                  total_iva = ${data.iva}
                  WHERE package_id = ${checkPackage.package_id};`

  return query
}

const updateStatus = (data, package_id, date, status) => {

  const query = `UPDATE paquetes SET weight = '${data.weight}',
                  description = '${data.description}', status = '${status}', total_a_pagar = ${data.total},
                  ent_date = '${status === 'Entregado' || status === 'Entregado con saldo pendiente' ? date : data.ent_date}',
                  anticipo = '${data.anticipo ? data.anticipo : '0'}',
                  pending_amount = ${data.pendiente ? data.pendiente : 0},
                  cif=${data.cif},
                  dai=${data.dai},
                  importe=${data.importe},
                  total_iva = ${data.iva},
                  guia = '${data.guia}',
                  poliza = '${data.poliza}',
                  costo_producto = ${data.cost}
                  WHERE package_id = ${parseInt(package_id, 10)};`
  
  return query
}

const remove = package_id => {
  const query = `UPDATE paquetes SET status = 'DELETED' AND cancelado = 1 WHERE id = ${parseInt(package_id, 10)};`
  return query
}

const findByTracking = data => {
  const query = `SELECT * FROM paquetes A WHERE A.tracking = '${data.tracking}' and A.client_id = '${data.client_id}'`
  return query
}

const getUserInfo = user => {
  const query = `SELECT email, contact_name, client_name, phone FROM clientes WHERE client_id = '${user}'`
  return query
}

const saveRemaining = (data, date) => {
  let total = data.total_a_pagar ? data.total_a_pagar : parseInt(data.weight, 10) * parseInt(data.cuota, 10)

  if (!total) total = data.total ? data.total.replace('Q', '') : 0

  if (data.status === 'Entregado') {
    data.anticipo = total
  }
  const query = `INSERT INTO accounts_receivable (package_id, amount, charge, remaining, client_id, date)
                  VALUES (${data.package_id},${total},${data.anticipo ? parseInt(data.anticipo) : 0},${
    data.pendiente ? parseInt(data.pendiente) : 0
  },'${data.client_id}', '${date}')`

  return query
}

const transfer = params => {
  const moment = require('moment-timezone')
  
  const query = ` UPDATE paquetes 
                SET total_a_pagar = ${params.total}, client_id = '${params.client_id}' ,
                ent_date = '${params.ent_date === '0000-00-00' ? '0000-00-00' : moment(params.ent_date).tz('America/Guatemala').format('YYYY-MM-DD')}'
                WHERE package_id = ${params.package_id} `

  return query
}

const checkClient = params => {
  const query = `SELECT client_id,email,client_name,contact_name FROM clientes WHERE client_id = '${params}'`
  return query
}

const updateClient = params => {
  const query = `UPDATE clientes 
                  SET client_id='${params.new_client_id.toUpperCase()}', 
                  reference_id='${params.client_id.toUpperCase()}'
                  WHERE client_id='${params.client_id.toUpperCase()}'`
  return query
}

const updateClientPackages = params => {
  const query = `UPDATE paquetes 
                  SET client_id='${params.new_client_id.toUpperCase()}'                 
                  WHERE client_id='${params.client_id.toUpperCase()}'`
  return query
}

const logPackage = data => {
  const insert = `INSERT INTO log (entity, action, register)
                  VALUES('${data.new_client_id ? 'CLIENT':'PACKAGE'}','TRANSFER','${JSON.stringify(data)}')`

  return insert
}

const downloadSimple = (date, package_id) => {
  const query = `UPDATE paquetes SET ent_date = '${date}',
                  delivery = '${0}',
                  entregado = '${0}',
                  cancelado = ${0},
                  anticipo = '${0}',
                  pending_amount = ${0},
                  status = 'Entregado'
                  WHERE package_id = ${parseInt(package_id, 10)};`

  return query
}

const checkGuide = ( data ) => {
  const query = `SELECT * FROM guides WHERE master = '${data.master}' AND poliza = '${data.poliza}'`
  return query
}

const postGuide = ( data ) => {
  const query = `INSERT INTO guides (master, poliza, status)
                  VALUES('${data.master}','${data.poliza}','ACTIVO')`;
  
  return query
}

const closeGuide = (data, date) => {
  const query = `UPDATE guides SET date_closed = '${date}',
                  status = 'CLOSED'
                  WHERE master = '${data.master}' AND poliza = '${data.poliza}';`
  return query
}

const getGuides = ( ) => {
  
  const query = `SELECT g.id as id, p.master as master, p.poliza as poliza, g.status as status, COUNT(p.package_id) as paquetes
                  FROM guides g
                  LEFT JOIN paquetes p on g.master = p.master AND g.poliza = p.poliza
                  GROUP by g.master, g.poliza
                  ORDER by g.id DESC`
  return query
}

const getGuidesOpens = ( ) => {
  
  const query = ` SELECT * FROM 
                  FROM guides g
                  WHERE status = 'ACTIVE'
                  ORDER by g.id DESC`
  return query
}



module.exports = {
  get: read,
  post: create,
  put: update,
  delete: remove,
  getByid: detail,
  postDetail: createDetail,
  findByTracking,
  getUserInfo,
  updateStatus,
  saveRemaining,
  transfer,
  logPackage,
  downloadSimple,
  checkGuide,
  closeGuide,
  postGuide,
  getGuides,
  getGuidesOpens,
  checkClient,
  updateClient,
  updateClientPackages
}
