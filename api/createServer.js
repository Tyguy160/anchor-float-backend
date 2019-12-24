const { ApolloServer } = require('apollo-server-express');

const { getDB } = require('../prisma/db');
const typeDefs = require('./schema');
const Mutation = require('./resolvers/Mutation');
const Query = require('./resolvers/Query');
const { populateUser } = require('./user');

const sleep = sleepTime => new Promise(resolve => setTimeout(resolve, sleepTime));

const resolvers = { Mutation, Query };

function initDB() {
  let db;
  async function connectToDB() {
    if (db) {
      return db;
    }
    let connected;
    const MAX_FAILURES = 5;
    let failureCount = 0;
    while (!connected && failureCount < MAX_FAILURES) {
      try {
        db = getDB();
        console.info(`\nConnecting to DB. Attempt #${failureCount + 1}...\n`); // eslint-disable-line no-console
        await db.connect(); // eslint-disable-line no-await-in-loop

        connected = true; // connecting worked
        console.info('\nConnected to the DB.');
      } catch (err) {
        failureCount += 1;

        console.error(err); // eslint-disable-line no-console
        console.error('Failed to connect to DB. Retrying in 5 seconds...\n'); // eslint-disable-line no-console

        if (failureCount === MAX_FAILURES) {
          // eslint-disable-next-line no-console
          console.error(
            `\nFailed to connect to DB after ${MAX_FAILURES} attempts.\nExiting process with code 0...`,
          );
          process.exit(); // exit with code 0 (success) because this is a DB issue
        } else {
          await sleep(5000); // eslint-disable-line no-await-in-loop
        }
      }
    }
    return db;
  }

  return connectToDB;
}

const getDBConnection = initDB();

async function createServer() {
  const db = await getDBConnection();
  return new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }) => {
      const user = populateUser(req);
      return {
        user,
        db,
        req,
        res,
      };
    },
  });
}

module.exports = { createServer, getDBConnection };
