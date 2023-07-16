const mysql = require('mysql');

function criaConexao(){
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'db_sintra'
    });
    
    connection.connect((error) => {
      if (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
        return;
      }
    });

    return connection;
}

module.exports = criaConexao();