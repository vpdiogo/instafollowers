const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'application/javascript; charset=utf-8']],
  ['/jszip.min.js', ['node_modules/jszip/dist/jszip.min.js', 'application/javascript; charset=utf-8']]
]);

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

http.createServer((request, response) => {
  const requested = request.url.split('?')[0];
  const asset = files.get(requested);

  if (!asset) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Página não encontrada.');
    return;
  }

  const [relativePath, contentType] = asset;
  fs.readFile(path.join(root, relativePath), (error, content) => {
    if (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Não foi possível carregar este arquivo. Rode npm install e tente novamente.');
      return;
    }
    response.writeHead(200, { 'Content-Type': contentType });
    response.end(content);
  });
}).listen(port, host, () => {
  console.log(`Insta Followers disponível neste computador: http://localhost:${port}`);
  console.log(`Na sua rede Wi-Fi, acesse: http://SEU-IP-LOCAL:${port}`);
});
