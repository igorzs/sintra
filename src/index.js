const { exec } = require('child_process');

// Função para exibir saída dos processos
function exibirSaida(nomeProcesso, stream) {
    stream.on('data', (data) => {
      console.log(`Saída do ${nomeProcesso}: ${data}`);
    });
}

// Iniciar o primeiro processo
const processo1 = exec('node nlp.js');

exibirSaida('processo 1', processo1.stdout);
exibirSaida('processo 1 erro', processo1.stderr);

// Iniciar o segundo processo
const processo2 = exec('node venom.js');

exibirSaida('processo 2', processo2.stdout);
exibirSaida('processo 2 erro', processo2.stderr);

// Gerenciar os processos
processo1.on('close', (code) => {
  console.log(`Processo 1 encerrado com código ${code}`);
});

processo2.on('close', (code) => {
  console.log(`Processo 2 encerrado com código ${code}`);
});
