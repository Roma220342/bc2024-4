const http = require('http');
const { program } = require('commander');
const fs = require('fs');


program
    .requiredOption('-h, --host <type>', 'адреса сервера')
    .requiredOption('-p, --port <number>', 'порт сервера')
    .requiredOption('-c, --cache <path>', 'шлях до директорії, де будуть закешовані файли');

program.configureOutput({
    writeErr: (str) => {
        console.error("Не задано обов'язкові параметри '-h (--host), -p(--port), -c(cache <path>)'");
        process.exit(1);
    }
});

program.parse(process.argv);


const options = program.opts();
const host = options.host;
const port = options.port;
const cachePath = options.cache; 

// Обробка запиту
const requestListener = function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Юxyy!! Сервер паше!!!');
};

// Створення HTTP сервера
const server = http.createServer(requestListener);

server.listen(port, host, () => {
    console.log(`Сервер стартанув на http://${host}:${port}`);
});