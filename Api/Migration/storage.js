module.exports.findMaxId = () => {
  const query = `SELECT max(client_id) client_id FROM clientes c WHERE client_id LIKE 'P%'`;

  return query;
};

module.exports.oldIdUsers = () => {
  const query = `Select * From clientes WHERE client_id not like 'P%' order by client_id `;
  return query;
};

module.exports.updateUserId = (currentUserId, newUserId) => {
  const query = `UPDATE clientes SET reference_id=client_id, client_id ='${newUserId}' WHERE client_id='${currentUserId}' `;
  return query;
};

module.exports.updateTransactions = (currentUserId, newUserId) => {
    const query = `UPDATE paquetes SET client_id='${newUserId}' WHERE client_id='${currentUserId}' `;
    return query
};

module.exports.migrateNewUsers = (mails) => {
    const query =`Select * from clientes where clientes.email not in (${mails}) order by email asc`
    return query
}

module.exports.getcurrentUsersMails = () => {
    const query = `SELECT email FROM usuarios`
    return query
}

module.exports.insertClients = (users) => {
  let query = `INSERT INTO clientes
    (client_id, contact_name, client_name, email, phone, nit, invoice_name, salesman, birthday, main_address, vip, entrega, cuota, message_user, message_admin, preferences, date_created, terms_date, terms_ip, terms, hashed_password, id_usuario)
    VALUES `;
  let inserts = users.map(
    ({
      client_id,
      contact_name,
      client_name,
      email,
      phone,
      nit,
      invoice_name,
      salesman,
      birthday,
      main_address,
      vip,
      entrega,
      cuota,
      message_user,
      message_admin,
      preferences,
      date_created,
      terms_date,
      terms_ip,
      terms,
      hashed_password     
    }) => `('${client_id}', ${contact_name == null ? 'NULL' : `'${contact_name.replace(/'/g, '`')}'` }, ${client_name == null ? 'NULL' : `'${client_name.replace(/'/g, '`')}'` }, ${email == null ? 'NULL' : `'${email}'` }, ${phone == null ? 'NULL' : `'${phone}'` }, ${nit == null ? 'NULL' : `'${nit}'` }, ${invoice_name == null ? 'NULL' : `'${invoice_name}'` }, ${salesman == null ? 'NULL' : `'${salesman.replace(/'/g, '`')}'` }, ${birthday == null ? 'NULL' : `'${birthday}'` }, ${main_address == null ? 'NULL' : `'${main_address.replace(/'/g, '`')}'` },${vip == null ? 'NULL' : `'${vip}'` }, ${entrega == null ? 'NULL' : `'${entrega}'` }, ${cuota == null ? 'NULL' : `'${cuota}'` }, ${message_user == null ? 'NULL' : `'${message_user}'` }, ${message_admin == null ? 'NULL' : `'${message_admin}'` }, ${preferences == null ? 'NULL' : `'${preferences}'` }, ${date_created == null ? 'NULL' : `'${date_created}'` }, ${terms_date == null ? 'NULL' : `'${terms_date}'` }, ${terms_ip == null ? 'NULL' : `'${terms_ip}'` }, ${terms == null ? 'NULL' : `'${terms}'` }, ${hashed_password == null ? 'NULL' : `'${hashed_password}'` }, (select id from usuarios where email='${email}')) `
  );

  query += inserts.join(",");
  return query;
};

module.exports.insertUsers = (users) => {
 let query = `INSERT INTO usuarios
 (name, hashed_password, email, type, new_column, activo)
 VALUES 
 `
 let inserts = users.map(({client_name, hashed_password, email, type, new_column, activo}) => `('${client_name ? client_name.replace(/'/g, '`'): ''}', '${hashed_password}', '${email}', 'cliente', 0, 'Y') `)
 query += inserts.join(",");
  return query;
}

