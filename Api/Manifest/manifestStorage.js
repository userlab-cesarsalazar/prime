const createManifest = data => ` INSERT INTO manifest
                  (manifest_id, description, status)
                  VALUES(
                    ${data.manifest_id ? data.manifest_id : 'NULL'},
                    '${data.description.toUpperCase()}',
                    'OPEN'
                  );`

const readManifest = params => {
  const statusWhereCondition = params.status ? `m.status = '${params.status.toUpperCase()}'` : `1=1`
  const descriptionWhereCondition = params.description ? `m.description = '${params.description}'` : `1=1`

  return `
    SELECT m.manifest_id, m.description, m.status, COUNT(p.package_id) AS packages_count
    FROM manifest m
    LEFT JOIN paquetes p ON p.manifest_id = m.manifest_id
    WHERE ${statusWhereCondition} AND ${descriptionWhereCondition}
    GROUP BY m.manifest_id
    ORDER BY manifest_id DESC LIMIT 25
  `
}

const getMAXManifest = () => `SELECT MAX(manifest_id) as manifest_id from manifest`

const updateManifest = (data, id) => `UPDATE manifest SET description='${data.description.toUpperCase()}', 
                                      status='${data.status}' WHERE manifest_id=${id};`

const getPackagesByManifestId = params => {
  const polizaWhereCondition = params.polizaFilter ? `AND A.poliza LIKE '%${params.polizaFilter}%'` : ''
  const noNullWhereCondition =
    String(params.noNullMaster) === '0'
      ? 'AND (A.master = "" OR A.master IS NULL) AND (A.poliza = "" OR A.poliza IS NULL)'
      : String(params.noNullMaster) === '1'
      ? 'AND (A.master <> "" OR A.master IS NOT NULL) AND (A.poliza <> "" OR A.poliza IS NOT NULL)'
      : ''

  return `SELECT A.package_id, A.tracking, S.name as supplier_name, C.client_name, A.weight, A.description,
    A.guia as warehouse, round(A.costo_producto ,2) as costo_producto, A.cif, A.tasa, A.status, A.importe, A.guia, A.cif, A.dai,
    A.master, A.poliza, A.manifest_id, A.total_iva, A.total_a_pagar, A.ing_date, A.pieces, A.tariff_code,
    A.voucher_bill, A.voucher_payment, T.description AS tariff_description, T.id AS tariff_code,
    T.code AS tariff_nro_partida, CAST((T.tasa * 100) AS SIGNED) AS tariff_tasa,C.nit AS nit,valor_miami, A.costo_producto as costo_producto_b
    FROM paquetes A
    LEFT JOIN clientes C on A.client_id = C.client_id 
    LEFT JOIN suppliers S on A.supplier_id = S.id
    LEFT JOIN tariffs T on A.tariff_code = T.id
    WHERE A.manifest_id = ${params.manifest_id} ${polizaWhereCondition} ${noNullWhereCondition}`
}

module.exports = {
  createManifest,
  readManifest,
  updateManifest,
  getMAXManifest,
  getPackagesByManifestId,
}
