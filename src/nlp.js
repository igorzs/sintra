const { dockStart } = require('@nlpjs/basic');
const loadCorpus = require('./corpus');

(async () => {
  const dock = await dockStart();
  const nlp = dock.get('nlp');

  const corpus = await loadCorpus();

  if (!corpus) {
    console.error('Error import corpus');
    return;
  }

  await nlp.addCorpus(corpus);
  await nlp.train();
})();