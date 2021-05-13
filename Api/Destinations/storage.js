const createDestination = data => {
  const query = ` INSERT INTO destinations
                  (name, status)
                  VALUES('${data.name}', 'ACTIVE');`
  return query
}

const readDestinations = () => {
  const query = ` SELECT *
                  FROM destinations A
                  WHERE status = 'ACTIVE'
                  ORDER by A.id DESC`
  return query
}

const updateDestination = (data, id) => {
  const query = `UPDATE destinations SET name='${data.name}' WHERE id=${id};`
  return query
}

const deleteDestination = id => {
  const query = `UPDATE destinations SET status = 'INACTIVE' WHERE id = '${id}'`
  return query
}

module.exports = {
  createDestination,
  readDestinations,
  updateDestination,
  deleteDestination,
}
