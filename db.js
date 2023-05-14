const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const filepath = "./sintra.db";

function criaConexao(){
    if(fs.existsSync(filepath)){
        return new sqlite3.Database(filepath);
    }else{
        const db = new sqlite3.Database(filepath, (error) => {

            if(error){
                return console.error(error.message);
            }

            criaTabelaConversas(db);

        });

        console.log("Conexão feita com sucesso");
        return db;
    }
}

function criaTabelaConversas(db){
    db.exec(`
        CREATE TABLE conversas
        (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_cliente VARCHAR(200),
            telefone_cliente VARCHAR(15) NOT NULL,
            id_conversa_nlp VARCHAR(36) NOT NULL,
            data_registro DATETIME NOT NULL
        );
    `)
}

module.exports = criaConexao();