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

//для PUT
const updateOrSave = (code, savePath) => {
    return superagent
        .get('https://http.cat' + code)
        .buffer(true)
        .then((response) => fs.writeFile(savePath, response.body));
};

//функція для скорочення відповідей 
const sendResponse = (res, statusCode, contentType, message) => {
    res.writeHead(statusCode, { 'Content-Type': contentType });
    res.end(message);
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
                        return updateOrSave(code, full_path)
                            .then(() => {
                                sendResponse(res, 200, 'utf-8', 'Порядок, картинку оновлено');
                            });
                    })
                    .catch(() => {
                        // Якщо файл не існує - створюємо 
                        return updateOrSave(code, full_path)
                            .then(() => {
                                sendResponse(res, 201, 'utf-8','Порядок, картинку збережено');
                            })
                            .catch(() => {
                                sendResponse(res, 404, 'utf-8', 'Халепа, картинку не знайдено на сервері');
                            });
                    });
                break;

            case 'GET':
                fs.access(full_path)
                    .then(() => fs.readFile(full_path))
                    .then((result) => {
                        sendResponse(res, 200, 'image/jpeg', result);
                    })
                    .catch(() => {
                        return updateOrSave(code, full_path)
                            .then((response) => {
                                sendResponse(res, 200, 'image/jpeg', result);
                            })
                            .catch(() => {
                                sendResponse(res, 404, 'utf-8','Халепа, картинку не знайдено на сервері');
                            });
                    });
                break;

            case 'DELETE':
                fs.access(full_path)
                    .then(() => fs.unlink(full_path))
                    .then(() => {
                        sendResponse(res, 200, 'utf-8', 'Добре, картинку видалив');
                    })
                    .catch(() => {
                        sendResponse(res, 404, 'utf-8', 'Ой-ой, картинку не знайдено в папці "cache"');
                    });
                break;

            default:
                sendResponse(res, 405, 'utf-8', 'Таке не можна. Метод не дозволено');
                break;
        }

    } catch (err) {
        console.error(err);
        sendResponse (res, 500, 'utf-8', 'Серверна халепа');
    }
};

const server = http.createServer(requestListener);

server.listen(port, host, () => {
    console.log(`Сервер стартанув на http://${host}:${port}`);
});
