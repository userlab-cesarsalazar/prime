const createManifest = data => ` INSERT INTO manifest
                  (description, status)
                  VALUES('${data.description.toUpperCase()}', 'OPEN');`

const readManifest = () =>  ` SELECT *
                  FROM manifest A
                  WHERE status = 'OPEN'
                  ORDER by A.manifest_id DESC`

const getMAXManifest = () => `SELECT MAX(manifest_id) as manifest_id from manifest`

const updateManifest = (data, id) => `UPDATE manifest SET description='${data.description.toUpperCase()}', 
                                      status='${data.status}' WHERE manifest_id=${id};`

module.exports =  {
    createManifest,
    readManifest,
    updateManifest,
    getMAXManifest
}
