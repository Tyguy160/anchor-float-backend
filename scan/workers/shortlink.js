
const uuid = require('uuid/v4');
const axios = require('axios');

const { createAndConnectProducer } = require('../producers');
const { getDataFromMessage, extractAsinFromUrl } = require('./utils');
const progress = require('../../progress/index');

async function unwrapUrl(shortUrl) { // FIXME
  const url = new URL(shortUrl);

  const { status, headers } = await axios
    .head(url.href, { maxRedirects: 0 })
    .catch((err) => {
      if (err.response.status) {
        return err.response;
      }

      return null;
    });

  if (status && status < 300) {
    return { err: 'Response was not a redirect', data: null };
  }

  if (headers && headers.location) {
    return {
      err: null,
      data: headers.location,
    };
  }

  return { err: 'Location headers not present in redirect', data: null };
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

  if (!url.hostname.includes('amzn.to')) {
    console.log(`Not an Amazon shortlink: ${url.href}`);
    return;
  }

  const { err, data: unwrappedUrl } = await unwrapUrl(url.href);

  if (err || !unwrappedUrl) {
    console.log('Err finding redirect. Returning.');
    console.log({ err, unwrappedUrl });
    return;
  }

  const asin = extractAsinFromUrl(unwrappedUrl);

  if (asin) {
    const createAndConnectTaskId = uuid();
    console.log(`Creating createAndConnect job for ${asin}`);

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
      (producerError) => {
        if (producerError) console.log(producerError);
      },
    );

    progress.productConnectAdded({
      jobId,
      taskId: createAndConnectTaskId,
    });
  }
}

module.exports = { parseShortlinkHandler };
