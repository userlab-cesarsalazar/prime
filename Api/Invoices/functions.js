const buildXML = (data, moment) => {
  //build XML Header
  let _xml_header = `<stdTWS xmlns="FEL">
                    <TrnEstNum>1</TrnEstNum>
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
  
  //build XML detail
  let line = 1
  let _xml_detail = ``
  data.items.forEach( (x)=> {
    let str = `<stdTWS.stdTWSCIt.stdTWSDIt>
                  <TrnLiNum>${line}</TrnLiNum>
                  <TrnArtCod>${ x.description === 'Desaduanaje' ? 'D' : x.description === 'Flete' ? 'F': 'E'}</TrnArtCod>
                  <TrnArtNom>${ x.description }</TrnArtNom>
                  <TrnCan>${x.qty}</TrnCan>
                  <TrnVUn>${x.amount}</TrnVUn>
                  <TrnUniMed>UNI</TrnUniMed>
                  <TrnVDes>0.0</TrnVDes>
                  <TrnArtBienSer>S</TrnArtBienSer>
                  <TrnArtImpAdiCod>0</TrnArtImpAdiCod>
                  <TrnArtImpAdiUniGrav>0</TrnArtImpAdiUniGrav>
                 </stdTWS.stdTWSCIt.stdTWSDIt>`
    
    _xml_detail = _xml_detail + str
  })
  _xml_detail = `<stdTWSD>${_xml_detail}</stdTWSD></stdTWS>`
  let xml = _xml_header + _xml_detail
  xml = xml.replace(/\n/g,'')
  return xml
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

module.exports = {
  buildXML,
  generateCorrelative
}