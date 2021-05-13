const createSupplier = data => {
  const query = ` INSERT INTO suppliers
                  (name, address, code, phone, status)
                  VALUES('${data.name.toUpperCase()}', '${data.address}', '${
    data.code
  }', '${data.phone}', 'ACTIVE');`
  return query
}

const readSuppliers = () => {
  const query = ` SELECT *
                  FROM suppliers A
                  WHERE status = 'ACTIVE'
                  ORDER by A.id DESC`
  return query
}

const updateSuppliers = (data, id) => {
  const query = `UPDATE suppliers SET name='${data.name.toUpperCase()}', address='${
    data.address
  }', phone='${data.phone}' WHERE id=${id};`
  return query
}

const deleteSupplier = id => {
  const query = `UPDATE suppliers SET status = 'INACTIVE' WHERE id = '${id}'`
  return query
}

const createCarries = data => {
  const query = ` INSERT INTO carriers (name, status, code) VALUES('${data.name.toUpperCase()}', 'ACTIVE', '${
    data.code
  }');`
  return query
}

const readCarries = () => {
  const query = ` SELECT *
                  FROM carriers
                  WHERE status = 'ACTIVE'
                  ORDER by id DESC`
  return query
}

const updateCarrie = (data, id) => {
  const query = `UPDATE carriers SET name='${data.name.toUpperCase()}' WHERE id=${id}`
  return query
}

const deleteCarries = id => {
  const query = `UPDATE carriers SET status = 'INACTIVE' WHERE id = '${id}'`
  return query
}

module.exports = {
  createSupplier,
  readSuppliers,
  updateCarrie,
  deleteSupplier,
  createCarries,
  readCarries,
  updateSuppliers,
  deleteCarries,
}
