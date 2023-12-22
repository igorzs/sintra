const { dockStart } = require('@nlpjs/basic');
const corpus = require('./corpus');

(async () => {
  const dock = await dockStart();
  const nlp = dock.get('nlp');
  await nlp.addCorpus(corpus);
  await nlp.train();
})();