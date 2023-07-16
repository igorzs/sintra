const dateTime = require('node-datetime');
const db = require('./db.js');
const venom = require('venom-bot');

venom
  .create({
    session: 'session-name'
  })
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {
  client.onMessage((message) => {
    if (message.isGroupMsg === false) {

        console.log('-----------------SINTRA-----------------');
        console.log('Mensagem recebida, dados do contato:');
        console.log('   Nome do contato: ', message.notifyName); 
        console.log('   Número do contato: ', message.from); 
        console.log('   Msg do contato: "', message.body + '"'); 

        const contato_nome = message.notifyName;
        const contato_whats = message.from.replace("@c.us", "");
        const contato_msg = removerCaracteresEspeciais(removerAcentos(message.body)).toLowerCase();

        let conversa_id, nlp_conversa_id, posicao_conversa, sintra_resposta, nova_posicao_conversa;

        checaSeExisteConversa(contato_whats)
        .then(async dados_conversa => {

            console.log('\nChecagem de conversa existente:');

            if(dados_conversa != ""){

                console.log(`Conversa encontrada para o Contato WhatsApp:${contato_whats}`);

                nlp_conversa_id = dados_conversa.id_conversa_nlp;
                conversa_id = dados_conversa.id;
                posicao_conversa = dados_conversa.posicao_conversa;

            } else {
            
                console.log(`Nenhuma conversa encontrada para o contato ${contato_whats}, vamos criar!`);

                nlp_conversa_id = iniciaConversaNLP();
                conversa_id = await salvaConversaToken(nlp_conversa_id, contato_nome, contato_whats);
                posicao_conversa = 0;
    
            }

            //Verifica se o usuário pediu por uma simulação Solar, se sim ativa a simulação
            if(posicao_conversa == 0 && contato_msg == 'simulador solar'){
                atualizaPosicaoConversa(conversa_id, 1);
                posicao_conversa = 1;

                sintra_resposta = "Vamos iniciar o Simulador Solar. Fazer a primeira pergunta";

            }
    
            if(posicao_conversa > 0 && contato_msg != 'simulador solar'){

                //O usuário está em uma Simulação Solar
                resultado_simulador = getResultadoSimuladorSolar(contato_msg);

                if(resultado_simulador == ""){
                    sintra_resposta = "Desculpe, não entendi sua resposta. Informe o gasto com a ultima fatura: "
                }else{
                    sintra_resposta = resultado_simulador;
                    atualizaPosicaoConversa(conversa_id, 0);
                }

            } else if (posicao_conversa == 0) {

                //O usuário está em uma conversação normal
                const nlp_resposta_id = adicionaAtividadeNLP(nlp_conversa_id, contato_msg);
                sintra_resposta = getRespostaNLP(nlp_conversa_id, nlp_resposta_id);

            }

            console.log(`Resposta processada: "${sintra_resposta}"`);

            //Armazena as respostas
            salvaConversaMsg(conversa_id, 1, posicao_conversa, contato_msg);
            salvaConversaMsg(conversa_id, 0, posicao_conversa, sintra_resposta);

            let arrayRespostas = sintra_resposta.split('||');

            if(arrayRespostas.length > 2 && posicao_conversa == 0){
                arrayRespostas.unshift(getMensagemInicialAleatoria());
            }

            for(let i = 0; i < arrayRespostas.length; i++){
                client.sendText(contato_whats + '@c.us', arrayRespostas[i].replace('{whats_nome}', contato_nome));
                await esperar(2500);
            }

            console.log('Resposta enviada com sucesso!');
            console.log('-----------------SINTRA:END-------------');
    
        })
        .catch(err => console.log(`Error: ${err}`));
    }
  });
}

function getResultadoSimuladorSolar(contato_msg){

    let fatura_paga = contato_msg;

    fatura_paga = parseFloat(fatura_paga.replace(/[^0-9.,]/g,'').replace(',', '.'));

    if(!isNaN(fatura_paga)){

        const custo_por_kwh_ceee = 0.65;
        const consumo_kwh = Math.round(fatura_paga / custo_por_kwh_ceee);

        //Painel Solar de 410W
        const media_geracao_por_painel_kwh_mes = 44.28;
        const largura_painel = 0.996;
        const altura_painel = 2.015;
        const media_preco = 2100;

        //Resultado
        const quant_paineis = Math.round(consumo_kwh / media_geracao_por_painel_kwh_mes);
        const area_instalacao = Math.round(quant_paineis * largura_painel * altura_painel);
        const sistema_producao_kwh_mes = Math.round(quant_paineis * media_geracao_por_painel_kwh_mes);
        const economia_anual_fatura = Math.round((sistema_producao_kwh_mes * 12) * custo_por_kwh_ceee);
        const custo_sistema = Math.round(quant_paineis * media_preco);


        //Em nosso exemplo, 1 painel de 410W na região gera em média 44,28 kWh/mês

        let resultado = `Perfeito, calculando só um segundinho...☀||`;
        resultado += `Prontinho {whats_nome}, aqui está mais detalhes do sistema fotovoltaico ideal para você:||`;
        resultado += `Levando em consideração que você tem um consumo de *${consumo_kwh}kWh/mês*, você precisaria de *${quant_paineis} paineis solares* que ocupariam uma área de *${area_instalacao}m²* na sua residência. ||`;
        resultado += `Ah, e a boa notícia é que você teria uma economia anual de *R$ ${economia_anual_fatura},00* na sua fatura.||O custo total do sistema seria em torno de *R$ ${custo_sistema},00* .`;

        return resultado;

    } else {
        return "";
    }
}

function checaSeExisteConversa(telefone_cliente){
    return new Promise((resolve, reject) => {

        db.query(`SELECT * FROM conversas WHERE telefone_cliente LIKE '%${telefone_cliente}%'`, (error, results) => {
            if (error) reject(err);

            if(results.length > 0){
                resolve(results[0]);
            }else{
                resolve("");
            }

        });
    })
}

function listaConversas(){
    db.query(`SELECT * FROM conversas`, (error, row) => {
        if (error) {
          throw new Error(error.message);
        }
        console.log(row);
    });
}

function getMensagemInicialAleatoria(){

    let array = ["Com certeza, aqui está!", "Entendido, aqui está!", "Ok, aqui está!", "Perfeito, aqui está!", "Sem problemas, aqui está!", "Ótimo, aqui está!", "Excelente, aqui está!", "Pronto, aqui está!", "De acordo, aqui está!", "Feito, aqui está!" ];

    var indiceAleatorio = Math.floor(Math.random() * array.length);
    return array[indiceAleatorio];
}

/*
 * Registra uma nova converda com o chatbot
 * @returns avoid
 */
function salvaConversaToken(id_conversa_nlp, nome_cliente, telefone_cliente){
    let dt = dateTime.create();
    let data_registro = dt.format('Y-m-d H:M:S');

    return new Promise((resolve, reject) => {
        db.query(
            `INSERT INTO conversas (nome_cliente, telefone_cliente, id_conversa_nlp, data_registro) 
            VALUES (?, ?, ?, ?)`, [nome_cliente, telefone_cliente, id_conversa_nlp, data_registro], (error, results) => {
                if(error){
                    console.error(error.message);
                    resolve("");
                }
                resolve(results.insertId);
            }
        );
    });
}

/*
 * Atualiza a posicao da conversa
 * @returns avoid
 */
function atualizaPosicaoConversa(conversa_id, posicao){
    return new Promise((resolve, reject) => {
        db.query(
            `UPDATE conversas SET ? WHERE id = ?`, [{posicao_conversa: posicao}, conversa_id], (error, results) => {
                if(error){
                    console.error(error.message);
                    resolve("");
                }
            }
        );
    });
}

/*
 * Registra uma mensagem na conversa do usuário
 * @returns avoid
 */
function salvaConversaMsg(conversa_id, mensagem_do_usuario, posicao_conversa, msg){
    let dt = dateTime.create();
    let data_registro = dt.format('Y-m-d H:M:S');

    db.query(
        `INSERT INTO conversa_msg (id_conversa, mensagem, mensagem_do_usuario, data_registro, posicao_conversa) 
        VALUES (?, ?, ?, ?, ?)`, [conversa_id, msg, mensagem_do_usuario, data_registro, posicao_conversa],
        function (error){
            if(error){
                console.error(error.message);
            }
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

                /*if(atividade.nlp.intent == 'None'){
                    respostaTexto = "@Não encontrado nenhuma intenção";
                }else if(parseFloat(atividade.nlp.score) <= 0.7){
                    respostaTexto = "@Resposta não aceita, score muito baixo: " + atividade.nlp.score + "\n*Resposta: *" + atividade.text;
                }else if(atividade.text.includes('errorparam')){
                    respostaTexto = "@Resposta deu Errorparam";
                }else{
                    respostaTexto = atividade.text;
                }*/

                if(atividade.nlp.intent == 'None' || parseFloat(atividade.nlp.score) <= 0.71 || atividade.text.includes('errorparam')){
                    respostaTexto = "Desculpe, estou um pouco confusa. Será que você poderia me ajudar a entender reformulando sua pergunta?";
                }else{
                    respostaTexto = atividade.text;
                }

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
 * Inicia uma conversa com o NLP - Rest Connector
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

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function removerAcentos(texto) {
    var mapAcentos = {
      'a': /[àáâãäå]/g,
      'e': /[èéêë]/g,
      'i': /[ìíîï]/g,
      'o': /[òóôõö]/g,
      'u': /[ùúûü]/g,
      'c': /[ç]/g,
      'n': /[ñ]/g
    };
  
    for (var letra in mapAcentos) {
      var regex = mapAcentos[letra];
      texto = texto.replace(regex, letra);
    }
  
    return texto;
  }

  function removerCaracteresEspeciais(texto) {
    var regex = /[^\w\s.,]/g;
    return texto.replace(regex, "");
  }