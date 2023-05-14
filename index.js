
const dateTime = require('node-datetime');
const db = require("./db.js");


checaSeExisteConversa('519865262549')
    .then(conversaIdNLP => {
        conversaIdNLP != "" ? console.log('Tem conversa') : console.log('Não tem conversa');
    })
    .catch(err => console.log(`Error: ${err}`));



function checaSeExisteConversa(telefone_cliente){
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM conversas WHERE telefone_cliente LIKE '%${telefone_cliente}%'`, (error, rows) => {
            if (error) reject(err);
    
            if(rows.length > 0){
                resolve(rows[0].id_conversa_nlp);
            }else{
                resolve("");
            }

        });
    })
}

function listaConversas(){
    db.each(`SELECT * FROM conversas`, (error, row) => {
        if (error) {
          throw new Error(error.message);
        }
        console.log(row);
    });
}

/*
 * Registra uma nova converda com o chatbot
 * @returns avoid
 */
function salvaConversaToken(id_conversa_nlp, nome_cliente, telefone_cliente){
    let dt = dateTime.create();
    let data_registro = dt.format('Y-m-d H:M:S');

    db.run(
        `INSERT INTO conversas (nome_cliente, telefone_cliente, id_conversa_nlp, data_registro) 
        VALUES (?, ?, ?, ?)`, [nome_cliente, telefone_cliente, id_conversa_nlp, data_registro],
        function (error){
            if(error){
                console.error(error.message);
            }
            console.log(`Inserido registro com o ID: ${this.lastID}`);
        }
    );
}

/*
 * Pega a resposta NLP - Rest Connector
 * @returns String
 */
function getRespostaNLP(conversaId, respostaId){

    try {

        var respostaTexto = "";
        var request = require('sync-request');
        var res = request('GET', `http://localhost:3000/directline/conversations/${conversaId}/activities`);
        var data = JSON.parse(res.body);
        
        data.activities.forEach(atividade => {
            if(atividade.id == respostaId){
                respostaTexto = atividade.text;
            }
        });

        return respostaTexto;

    } catch (e) {

        console.log(`Erro na requisição: ${e}`);
        return {};

    }

}

/*
 * Adiciona uma interação na conversa
 * @returns token id da resposta do bot
 */
function adicionaAtividadeNLP(conversaId, mensagem){
    try {

        var rota = `http://localhost:3000/directline/conversations/${conversaId}/activities`;
        var request = require('sync-request');
        var res = request('POST', rota, {
            json: {
                "channelData": {
                    "clientActivityID": "16122752442687lh97zrqfx1",
                    "clientTimestamp": "2021-02-02T14:14:04.268Z"
                },
                "text": mensagem,
                "textFormat": "plain",
                "type": "message",
                "channelId": "webchat",
                "from": {
                    "id": "User",
                    "name": "",
                    "role": "user"
                },
                "locale": "pt-BR",
                "timestamp": "2021-02-02T14:14:04.268Z",
                "entities": [
                    {
                    "requiresBotState": true,
                    "supportsListening": true,
                    "supportsTts": true,
                    "type": "ClientCapabilities"
                    }
                ]
            }
        });

        var data = JSON.parse(res.body);
        return data.id;

    } catch (e) {

        console.log(`Erro na requisição: ${e}`);
        return {};

    }
}

/*
 * Inicia uma conversa com p NLP - Rest Connector
 * @returns id
 */
function iniciaConversaNLP(){
    try {

        var request = require('sync-request');
        var res = request('POST', 'http://localhost:3000/directline/conversations');
        var data = JSON.parse(res.body);
        return data.conversationId;

    } catch (e) {

        console.log(`Erro na requisição: ${e}`);
        return {};

    }
}