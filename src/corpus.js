const db = require('./db.js');

async function loadCorpus(){
    try {

        let knowledge = await retrieveUserInteractions();

        let corpus = {
            "name": "Sintra",
            "locale": "en-US",
            "contextData": {},
            "data" : knowledge
        }

        return corpus;
    } catch (error){
        console.error("Error import corpus: " , error);
    }
}

async function getAnswerQuestionByIntention(id_intention){
    return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM knowledge WHERE id_intention = ${id_intention}`, (error, data) => {
            resolve(data);
        });
    })
};

async function retrieveUserInteractions() {
    return new Promise(async (resolve, reject) => {
        try {
            const intentions = await new Promise((resolve, reject) => {
                db.query(`SELECT * FROM intentions`, (error, intentions) => {
                    resolve(intentions);
                })
            });

            let knowledge = [];

            for(const intention of intentions){
                if(intention.id != ""){
                    let questions_db = [];
                    let answers_db = [];

                    let data = await getAnswerQuestionByIntention(intention.id);

                    data.forEach((interation) => {
                        if(interation.type == 1){
                            questions_db.push(interation.text);
                        } else if(interation.type == 2){
                            answers_db.push(interation.text);
                        }
                    });

                    knowledge.push({
                        "intent": intention.intention,
                        "utterances": questions_db,
                        "answers": answers_db
                    });
                }
            }
            resolve(knowledge);
        }catch (error) {
            reject(error);
        }
    });
}

module.exports = loadCorpus;