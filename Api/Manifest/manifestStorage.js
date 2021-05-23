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

const getPackagesByManifestId = (manifest_id) => `SELECT A.tracking, S.name as supplier_name, C.client_name, A.weight, A.description,
                                                  A.client_id as warehouse, A.costo_producto 
                                                  FROM paquetes A
                                                  LEFT JOIN clientes C on A.client_id = C.client_id 
                                                  LEFT JOIN suppliers S on A.supplier_id = S.id
                                                  WHERE manifest_id = ${manifest_id}`

module.exports =  {
    createManifest,
    readManifest,
    updateManifest,
    getMAXManifest,
    getPackagesByManifestId
}
