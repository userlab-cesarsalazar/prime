const accounting = require('accounting-js')

const buildXML = (data, moment) => {
  //build XML Header
  //build XML Header
  
  let _xml_header = headerInvoice(data, moment)
  
  //build XML detail
  let line = 1
  let _xml_detail = ``
  let oea = ''
  let _dai =0
  let _iva =0
  data.items.forEach( (x)=> {
    let str = `<stdTWS.stdTWSCIt.stdTWSDIt>
                  <TrnLiNum>${line}</TrnLiNum>
                  <TrnArtCod>${ x.description === 'Desaduanaje' ? 'D' : x.description === 'Flete' ? 'F': 'E'}</TrnArtCod>
                  <TrnArtNom>${ x.description }</TrnArtNom>
                  <TrnCan>${x.qty}</TrnCan>
                  <TrnVUn>${x.unitario && x.cod_service !== 4 ? x.unitario : x.amount }</TrnVUn>
                  <TrnUniMed>UNI</TrnUniMed>
                  <TrnVDes>0.0</TrnVDes>
                  <TrnArtBienSer>S</TrnArtBienSer>
                  <TrnArtImpAdiCod>0</TrnArtImpAdiCod>
                  <TrnArtImpAdiUniGrav>0</TrnArtImpAdiUniGrav>
                 </stdTWS.stdTWSCIt.stdTWSDIt>`
     oea = x.item;
    if(x.package_id && x.cod_service === 1 ){
      _dai += x.dai
      _iva += parseFloat(x.total_iva)
    }
    _xml_detail = _xml_detail + str
  })
  _xml_detail = `<stdTWSD>${_xml_detail}</stdTWSD>
                 <stdTWSCA1>
                    <stdTWS.stdTWSCA1.stdTWSCA1It>
                        <Columna1>${oea} IVA</Columna1>
                        <Columna2>Texto Col 2</Columna2>
                        <Columna3>Texto Col 3</Columna3>
                        <Columna4>Texto Col 4</Columna4>
                        <Columna5>${_iva !== 0 ? accounting.toFixed(_iva, 2) : 0.000001}</Columna5>
                        <Columna6>Texto Col 6</Columna6>
                        <Columna7>Texto Col 7</Columna7>
                        <Columna8>Texto Col 8</Columna8>
                    </stdTWS.stdTWSCA1.stdTWSCA1It>
                    <stdTWS.stdTWSCA1.stdTWSCA1It>
                        <Columna1>${oea} DAI</Columna1>
                        <Columna2>Texto Col 2</Columna2>
                        <Columna3>Texto Col 3</Columna3>
                        <Columna4>Texto Col 4</Columna4>
                        <Columna5>${ _dai !== 0 ? accounting.toFixed(_dai, 2) : 0.000001}</Columna5>
                        <Columna6>Texto Col 6</Columna6>
                        <Columna7>Texto Col 7</Columna7>
                        <Columna8>Texto Col 8</Columna8>
                     </stdTWS.stdTWSCA1.stdTWSCA1It>
                    </stdTWSCA1>
                  </stdTWS>`
  
  let xml = _xml_header + _xml_detail
  xml = xml.replace(/\n/g,'')
  return xml
}

const buildXMLAllInclude = (data, moment) => {
  //build XML Header
  let _xml_header = headerInvoice(data, moment)
  //build XML detail
  let line = 1
  let _xml_detail = ''
  let oea = ''
  let amount_cuenta_ajena =0
  data.items.forEach( (x)=> {
  
    if(x.package_id && x.cod_service === 6 ){
      amount_cuenta_ajena += parseFloat(x.amount)
    }
    if(x.cod_service !== 6){
      let str = `<stdTWS.stdTWSCIt.stdTWSDIt>
                  <TrnLiNum>${line}</TrnLiNum>
                  <TrnArtCod>${ x.description === 'Servicio Courier' ? 'S' : x.description === 'Cuenta Ajena' ? 'C': 'E'}</TrnArtCod>
                  <TrnArtNom>${ x.description }</TrnArtNom>
                  <TrnCan>${x.qty}</TrnCan>
                  <TrnVUn>${x.unitario && x.cod_service !== 4 ? x.unitario : x.amount }</TrnVUn>
                  <TrnUniMed>UNI</TrnUniMed>
                  <TrnVDes>0.0</TrnVDes>
                  <TrnArtBienSer>S</TrnArtBienSer>
                  <TrnArtImpAdiCod>0</TrnArtImpAdiCod>
                  <TrnArtImpAdiUniGrav>0</TrnArtImpAdiUniGrav>
                 </stdTWS.stdTWSCIt.stdTWSDIt>`
      oea = x.item;
     
      _xml_detail = _xml_detail + str
    }
  })
  _xml_detail = `<stdTWSD>${_xml_detail}</stdTWSD>
                 <stdTWSCA1>
                    <stdTWS.stdTWSCA1.stdTWSCA1It>
                        <Columna1>${oea} Cuenta Ajena</Columna1>
                        <Columna2>Texto Col 2</Columna2>
                        <Columna3>Texto Col 3</Columna3>
                        <Columna4>Texto Col 4</Columna4>
                        <Columna5>${amount_cuenta_ajena !== 0 ? accounting.toFixed(amount_cuenta_ajena, 2) : 0.000001}</Columna5>
                        <Columna6>Texto Col 6</Columna6>
                        <Columna7>Texto Col 7</Columna7>
                        <Columna8>Texto Col 8</Columna8>
                    </stdTWS.stdTWSCA1.stdTWSCA1It>
                    </stdTWSCA1>
                  </stdTWS>`
  
  let xml = _xml_header + _xml_detail
  xml = xml.replace(/\n/g,'')
  return xml
}

const headerInvoice = (data, moment) => {
  return `<stdTWS xmlns="FEL">
                    <TrnEstNum>${data.store_id}</TrnEstNum>
                    <TipTrnCod>FACT</TipTrnCod>
                    <TrnNum>${data.transaction_number}</TrnNum>
                    <TrnFec>${moment().tz('America/Guatemala').format('YYYY-MM-DD')}</TrnFec>
                    <MonCod>GTQ</MonCod>
                    <TrnBenConNIT>${data.nit}</TrnBenConNIT>
                    <TrnExp>0</TrnExp>
                    <TrnExento>0</TrnExento>
                    <TrnFraseTipo>0</TrnFraseTipo>
                    <TrnEscCod>0</TrnEscCod>
                    <TrnEFACECliCod/>
                    <TrnEFACECliNom>${data.client_name}</TrnEFACECliNom>
                    <TrnEFACECliDir>${data.address}</TrnEFACECliDir>
                    <TrnObs>${data.observations}</TrnObs>
                    <TrnEmail>${data.email_client}</TrnEmail>`
}

const generateCorrelative = async (connection, query) => {
  try {
    let [num_control] = await connection.execute(query)
    //save the initial
    let initial = num_control[0].num_control[0]
    let secondPart = num_control[0].num_control.replace(/[A-Z]/g,'').length
    let maximum = parseInt(num_control[0].num_control.replace(/[A-Z]/g,'')) + 1
    let partNumeric = maximum.toString().length
    partNumeric = secondPart - partNumeric
    let _num_control = ''
    let _var = ''
    for (let i = 0 ; i < partNumeric; i++ ){
      _var += `0`
      _num_control = `${initial}${_var}${maximum}`
    }
    return _num_control
  }catch (e) {
    console.log(e,'ee')
  }
}

const calc = (theform) => {
  let num = theform.original.value, rounded = theform.rounded
  let with2Decimals = num.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]
  rounded.value = with2Decimals
}

module.exports = {
  buildXML,
  generateCorrelative,
  buildXMLAllInclude
}