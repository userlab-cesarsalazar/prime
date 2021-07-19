const createManifest = data => ` INSERT INTO manifest
                  (manifest_id, description, status)
                  VALUES(
                    ${data.manifest_id ? data.manifest_id : 'NULL'},
                    '${data.description.toUpperCase()}',
                    'OPEN'
                  );`

const readManifest = status => {
  console.log(status)
  const WHERE = status ? `status = '${status}'` : `1=1`
  const query = ` SELECT *
                    FROM manifest A
                    WHERE ${WHERE}
                    ORDER by A.manifest_id DESC LIMIT 25`
  return query
}

const getMAXManifest = () => `SELECT MAX(manifest_id) as manifest_id from manifest`

const updateManifest = (data, id) => `UPDATE manifest SET description='${data.description.toUpperCase()}', 
                                      status='${data.status}' WHERE manifest_id=${id};`

const getPackagesByManifestId = manifest_id =>
  `SELECT A.package_id, A.tracking, S.name as supplier_name, C.client_name, A.weight, A.description,
    A.client_id as warehouse, A.costo_producto, A.cif, A.tasa, A.status, A.importe, A.guia, A.cif, A.dai,
    A.master, A.poliza, A.manifest_id, A.total_iva, A.total_a_pagar, A.ing_date, A.pieces, A.tariff_code,
    A.voucher_bill, A.voucher_payment, T.description AS tariff_description, T.code AS tariff_code, T.tasa AS tariff_tasa
    FROM paquetes A
    LEFT JOIN clientes C on A.client_id = C.client_id 
    LEFT JOIN suppliers S on A.supplier_id = S.id
    LEFT JOIN tariffs T on A.tariff_code = T.id
    WHERE manifest_id = ${manifest_id}`

module.exports = {
  createManifest,
  readManifest,
  updateManifest,
  getMAXManifest,
  getPackagesByManifestId,
}
