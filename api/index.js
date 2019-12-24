const dotenv = require('dotenv');

dotenv.config();

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const { handleWebhook } = require('./webhook/handleWebhook');

const { createServer } = require('./createServer');

let httpServer = {
  close: (onCloseCallback) => {
    // mock close function in case server is never created
    console.info('No server to close. Exiting...'); // eslint-disable-line no-console
    onCloseCallback();
  },
};

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());

app.post('/stripe-checkout', handleWebhook);

createServer().then((server) => {
  server.applyMiddleware({
    app,
    path: '/graphql',
    cors: {
      origin: 'http://localhost:3000',
      credentials: true,
    },
  });

  if (!process.env.BACKEND_PORT) {
    console.error('\nMissing BACKEND_PORT environment variable. Exiting...\n'); // eslint-disable-line no-console
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  httpServer = app.listen(
    { port: process.env.BACKEND_PORT },
    // eslint-disable-next-line no-console
    () => console.info(
      `🚀 Server ready: http://localhost:${process.env.BACKEND_PORT}${server.graphqlPath}`,
    ),
  );
});

// shut down server
function shutdown() {
  httpServer.close((err) => {
    // Shut down the express server (if it exists)
    if (err) {
      console.error(err); // eslint-disable-line no-console
      process.exitCode = 1;
    }
    process.exit();
  });
}

// quit on ctrl-c when running docker in terminal
process.on('SIGINT', () => {
  // eslint-disable-next-line no-console
  console.info(
    '\n\nGot SIGINT (aka ctrl-c in docker). Graceful shutdown started at',
    new Date().toISOString(),
  );
  shutdown();
});

// quit properly on docker stop
process.on('SIGTERM', () => {
  // eslint-disable-next-line no-console
  console.info(
    '\n\nGot SIGTERM (docker container stop). Graceful shutdown started at',
    new Date().toISOString(),
  );
  shutdown();
});
