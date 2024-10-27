const http = require('http');
const { program } = require('commander');
const fs = require('fs').promises;
const url = require('url');
const path = require('path');
const superagent = require('superagent');

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

const getFilePath = (cachePath, code) => {
    return path.join(cachePath, `${code}.jpg`);
};

const requestListener = function (req, res) {
    try {
        let code = url.parse(req.url).pathname;
        const method = req.method;
        let full_path = getFilePath(cachePath, code);

        switch (method) { 
            case 'PUT':
                fs.access(full_path) 
                    .then(() => {
                        // Якщо файл існує - оновлюємо 
                        return superagent
                            .get('https://http.cat' + code)
                            .buffer(true)
                            .then((response) => fs.writeFile(full_path, response.body)) 
                            .then(() => {
                                res.writeHead(200, { 'Content-Type': 'text/html' });
                                res.end('Порядок, картинку оновлено');
                            });
                    })
                    .catch(() => {
                        // Якщо файл не існує - створюємо 
                        superagent
                            .get('https://http.cat' + code)
                            .buffer(true)
                            .then((response) => fs.writeFile(full_path, response.body)) 
                            .then(() => {
                                res.writeHead(201, { 'Content-Type': 'text/html' });
                                res.end('Порядок, картинку збережено');
                            })
                            .catch(() => {
                                res.writeHead(404, { 'Content-Type': 'text/plain' });
                                res.end("Халепа, картинку не знайдено на сервері");
                            });
                    });
                break;

            case 'GET':
                fs.access(full_path)
                    .then(() => fs.readFile(full_path))
                    .then((result) => {
                        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                        res.end(result);
                    })
                    .catch(() => {
                        superagent
                            .get('https://http.cat' + code)
                            .buffer(true)
                            .then((response) => fs.writeFile(full_path, response.body))
                            .then((response) => {
                                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                                res.end(response.body);
                            })
                            .catch(() => {
                                res.writeHead(404, { 'Content-Type': 'text/plain' });
                                res.end('Халепа, картинку не знайдено на сервері');
                            });
                    });
                break;

            case 'DELETE':
                fs.access(full_path)
                    .then(() => fs.unlink(full_path))
                    .then(() => {
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('Добре, картинку видалив');
                    })
                    .catch(() => {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('Халепа, картинку не знайдено на сервері');
                    });
                break;

            default:
                res.writeHead(405, { 'Content-Type': 'text/plain' });
                res.end('Таке не можна. Метод не дозволено');
                break;
        }

    } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Серверна халепа');
    }
};

const server = http.createServer(requestListener);

server.listen(port, host, () => {
    console.log(`Сервер стартанув на http://${host}:${port}`);
});
