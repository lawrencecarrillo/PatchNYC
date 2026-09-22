# Code Citations

## License: MIT
https://github.com/nodejs/nodejs.org/blob/01edbb9529508e058b1dcc6c58f0bfc17c44f47b/pages/ar/index.mdx

```
createServer } from 'node:http';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!\n');
});

// starts a simple http server locally on port 3000
server.listen(3000, '127.0.0.1', () => {
  console.log('Listening on 127.0.0.1:3000');
});

// run with `node server.mjs
```


## License: MIT
https://github.com/nodejs/nodejs.org/blob/01edbb9529508e058b1dcc6c58f0bfc17c44f47b/pages/en/index.mdx

```
createServer } from 'node:http';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!\n');
});

// starts a simple http server locally on port 3000
server.listen(3000, '127.0.0.1', () => {
  console.log('Listening on 127.0.0.1:3000');
});

// run with `node server.mjs
```

