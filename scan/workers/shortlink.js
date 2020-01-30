
const uuid = require('uuid/v4');

const { createAndConnectProducer } = require('../producers');
const { getDataFromMessage, extractAsinFromUrl } = require('./utils');
const progress = require('../../progress/index');

function unwrapUrl(shortUrl) { // FIXME
  const longUrl = `${shortUrl}#`;
  return longUrl;
}

async function parseShortlinkHandler({ Body }) {
  const shortUrl = getDataFromMessage(Body, 'shortUrl');
  const linkId = getDataFromMessage(Body, 'linkId');

  const jobId = getDataFromMessage(Body, 'jobId');
  const taskId = getDataFromMessage(Body, 'taskId');


  if (!shortUrl || !linkId || !jobId || !taskId) {
    console.log('praseShortlink info missing. returning early');
    return;
  }

  let url;
  try {
    url = new URL(shortUrl);
  } catch (err) {
    console.log(`Invalid url: ${shortUrl}`);
    return;
  }

  const fullUrl = unwrapUrl(url.href); // FIXME

  const asin = extractAsinFromUrl(fullUrl);

  if (asin) {
    const createAndConnectTaskId = uuid();

    createAndConnectProducer.send(
      [
        {
          id: createAndConnectTaskId,
          body: JSON.stringify({
            asin,
            linkId,
            jobId,
            taskId: createAndConnectTaskId,
          }),
        },
      ],
      (err) => {
        if (err) console.log(err);
      },
    );

    progress.productConnectAdded({
      jobId,
      taskId: createAndConnectTaskId,
    });
  }
}

module.exports = { parseShortlinkHandler };
