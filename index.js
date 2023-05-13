
/*
 * Pega a resposta NPL - Rest Connector
 * @returns String
 */
function getRespostaNPL(conversaId, respostaId){

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
function adicionaAtividadeNPL(conversaId, mensagem){
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
 * Inicia uma conversa com p NPL - Rest Connector
 * @returns id
 */
function iniciaConversaNPL(){
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