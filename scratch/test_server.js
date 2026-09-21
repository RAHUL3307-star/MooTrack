const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="no-referrer">
</head>
<body>
  <button id="btn" onclick="test()">Play Tamil</button>
  <div id="status">idle</div>
  <script>
    function test() {
      const status = document.getElementById('status');
      status.textContent = 'loading...';
      const audio = new Audio('https://translate.google.com/translate_tts?client=tw-ob&ie=UTF-8&tl=ta&q=' + encodeURIComponent('வணக்கம்'));
      audio.onplay = () => { status.textContent = 'playing!'; };
      audio.onerror = (e) => { status.textContent = 'error'; };
      audio.play().then(() => { status.textContent = 'play-started'; }).catch(err => { status.textContent = 'catch: ' + err.name; });
    }
  </script>
</body>
</html>`);
  }
});
server.listen(4567, () => console.log('READY'));
