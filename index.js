const http = require('http');
const { program } = require('commander');
const fs = require('fs').promises;
const url = require('url');

program
    .requiredOption('-h, --host <type>', 'адреса сервера')
    .requiredOption('-p, --port <number>', 'порт сервера')
    .requiredOption('-c, --cache <path>', 'шлях до директорії, де будуть закешовані файли');

program.configureOutput({
    writeErr: (str) => {
        console.error("Не задано обов'язкові параметри '-h (--host), -p (--port), -c (--cache <path>)'");
        process.exit(1);
    }
});

program.parse(process.argv);

const options = program.opts();
const host = options.host;
const port = options.port;
const cachePath = options.cache;

const routes = {
    '/health': {
        'GET': (req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Юxyy!! Сервер паше!!!' }));
        },
    },
};

// Обробка запиту
const requestListener = function (req, res) {
   try{

    const parsedUrl = new url.URL(req.url, `http://${req.headers.host}`);
    const handler = routes[parsedUrl.pathname]?.[req.method];

    if (handler) { // Якщо handler існує, викликати його
        handler(req, res);
    } else {
        // Відповідь на невідомі маршрути
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Не знайдено' }));
    }

   } catch (err){
    console.error(err)
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Помилка сервера' }));
   }
    
};

// Створення HTTP сервера
const server = http.createServer(requestListener);

server.listen(port, host, () => {
    console.log(`Сервер стартанув на http://${host}:${port}/health`);
});
