require('dotenv').config();
const uuid = require('uuid/v4');
const { sitemapProducer } = require('./producers.js');

const userInputUrl = process.argv.slice(2, 3)[0];
const userInputUserId = process.argv.slice(3, 4)[0];

console.log(`Adding sitemap URL: ${userInputUrl}`);
console.log(`Adding sitemap userId: ${userInputUserId}`);

sitemapProducer.send(
  [
    {
      id: uuid(),
      body: JSON.stringify({ url: userInputUrl, userId: userInputUserId }),
    },
  ],
  (err) => {
    if (err) console.log(err);
  },
);
