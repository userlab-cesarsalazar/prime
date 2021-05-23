const createManifest = data => ` INSERT INTO manifest
                  (description, status)
                  VALUES('${data.description.toUpperCase()}', 'OPEN';`

const readManifest = () =>  ` SELECT *
                  FROM manifest A
                  WHERE status = 'OPEN'
                  ORDER by A.id DESC`

const getMAXManifest = () => `SELECT MAX(id) from manifest`

const updateManifest = (data, id) => `UPDATE manifest SET description='${data.description.toUpperCase()}', 
                                      status='${data.status}' WHERE id=${id};`

module.exports =  {
    createManifest,
    readManifest,
    updateManifest,
    getMAXManifest
}
