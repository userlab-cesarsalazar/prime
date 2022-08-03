const create = (data,request,date) => {
    const query = `INSERT INTO logs (action, request,user,create_at)
    values ('${data.action}','${JSON.stringify(request)}','${data.user}','${date}');`    
    return query
  }

  module.exports = {
    post: create
  }