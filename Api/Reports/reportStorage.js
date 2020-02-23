const readList = (date, page) => {
  let _limit = 100
  let _page = 0
  let where = ''

  if (page && page > 1) {
    _page = (page - 1) * _limit
  } else {
    _page = 0
  }

  if (date) {
    where = `WHERE ent_date = '${date}'`
  }

  const query = `SELECT A.package_id, A.client_id, A.tracking, A.total_a_pagar, A.description, C.contact_name, A.ing_date, A.ent_date, A.status, A.weight
                FROM  paquetes A
                LEFT JOIN clientes C on A.client_id = C.client_id
                ${where}
                ORDER BY A.package_id ASC LIMIT ${_page},${_limit}`

  return query
}

const totalsByDate = date => {
  const query = `SELECT count(package_id) as tota_paquetes, sum(total_a_pagar) as total_cobrado ,sum(weight) as total_libras
                FROM paquetes
                WHERE ent_date = '${date}';`

  return query
}

const entryPackageDetail = date => {
  const query = `SELECT A.package_id, A.client_id, A.tracking, A.total_a_pagar, A.description, C.contact_name, A.ing_date, A.ent_date, A.status, A.weight
                FROM  paquetes A
                LEFT JOIN clientes C on A.client_id = C.client_id
                WHERE ing_date = '${date}' AND status != 'Registrado'
                ORDER BY A.package_id ASC ;`
  return query
}

const entryPackageTotal = date => {
  const query = `SELECT count(package_id) as tota_paquetes, sum(weight) as total_libras
                FROM paquetes
                WHERE ing_date = '${date}' AND status != 'Registrado'`
  return query
}

const packagesOnRouteTotal = () => {
  const query = `SELECT count(package_id) as tota_paquetes, sum(weight) as total_libras, sum(total_a_pagar) as total_por_cobrar from paquetes A
                inner join clientes B on A.client_id = B.client_id
                where B.entrega = 'Entrega a Domicilio'  AND (ent_date = '' OR ent_date ='0000-00-00') AND A.status != 'Registrado' AND A.status != 'Entregado.'`
  console.log(query, 'query 11')
  return query
}

const packagesOnRoute = _ => {
  const query = `select * from paquetes A
                inner join clientes B on A.client_id = B.client_id
                where B.entrega = 'Entrega a Domicilio' AND (ent_date = '' OR ent_date ='0000-00-00') AND A.status != 'Registrado' AND A.status != 'Entregado.'`

  return query
}

const packageInWarehouse = () => {
  const query = `select A.*, B.entrega from paquetes A
                  inner join clientes B on A.client_id = B.client_id
                  where B.entrega = 'Entrega en Traestodo'  AND (ent_date = '' OR ent_date ='0000-00-00') AND A.status != 'Registrado'
                  ORDER BY A.client_id DESC;`
  return query
}

const packageInWarehouseTotal = () => {
  const query = `SELECT count(package_id) as tota_paquetes, sum(weight) as total_libras, sum(total_a_pagar) as total_por_cobrar from paquetes A
                  inner join clientes B on A.client_id = B.client_id
                  where B.entrega = 'Entrega en Traestodo'  AND (ent_date = '' OR ent_date ='0000-00-00') AND A.status != 'Registrado' ;`
  return query
}

const stateAccount = (client_id, package_id) => {
  let where = ''
  let query = ''
  if (client_id > 0) {
    where = ` AND a.client_id = ${client_id} `
  }

  if (package_id > 0) {
    query = `SELECT date, remaining, a.client_id, package_id, amount, charge, C.contact_name
                  FROM accounts_receivable a
                  INNER JOIN clientes C on a.client_id = C.client_id
                  WHERE package_id = ${package_id}`
    return query
  }

  query = `SELECT date, remaining, a.client_id, package_id, amount, charge, C.contact_name
                  FROM accounts_receivable AS a
                  INNER JOIN clientes C on a.client_id = C.client_id
                  WHERE date = (
                      SELECT MAX(date)
                      FROM accounts_receivable AS b
                      WHERE a.package_id = b.package_id
                        AND a.client_id = b.client_id )
                ${where}
                HAVING remaining > 0;`
  return query
}

module.exports = {
  read: readList,
  totalsByDate,
  entryPackageDetail,
  entryPackageTotal,
  packageInWarehouse,
  packageInWarehouseTotal,
  packagesOnRoute,
  packagesOnRouteTotal,
  stateAccount,
}
