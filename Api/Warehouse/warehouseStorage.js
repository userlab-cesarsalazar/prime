const getSuppliers = () => {
  
  const query = ` SELECT *
                  FROM suppliers A
                  WHERE status = 'ACTIVE'
                  ORDER by A.id DESC`
  return query
}

const createSupplier = (data) => {
  
  const query = ` INSERT INTO suppliers
                  (name, description, status)
                  VALUES('${data.name.toUpperCase()}', '${data.description}', 'ACTIVE');`
  return query
}

const putSuppliers = (data,id) => {
  const query = `UPDATE suppliers SET name='${data.name}', description='${data.description}', status='ACTIVE' WHERE id=${id};`
  return query
}

const createCarries = (data) => {
  
  const query = ` INSERT INTO carriers (name, status) VALUES('${data.name.toUpperCase()}', 'ACTIVE');`
  return query
}

const putCarrie = (data,id) => {
  const query = `UPDATE carriers SET name='${data.name}', status='${data.status}' WHERE id=${id}`
  return query
}

const getCarries = () => {
  
  const query = ` SELECT *
                  FROM carriers A
                  WHERE status = 'ACTIVE'
                  ORDER by A.id DESC`
  return query
}

module.exports = {
  getSuppliers,
  getCarries,
  createSupplier,
  createCarries,
  putCarrie,
  putSuppliers
}
