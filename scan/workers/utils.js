function getDataFromMessage(messageBody, dataKey) {
  const body = JSON.parse(messageBody);
  if (!(dataKey in body)) {
    console.log(`Key "${dataKey}" not found in message body`);
    return null;
  }
  return body[dataKey];
}

function extractAsinFromUrl(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch (err) {
    throw new Error(`Invalid url: ${urlString} passwed to extractAsinFromUrl`);
  }

  const { pathname } = url;

  const asinRegexs = [
    /\/dp\/([^\?#\/]+)/i, // eslint-disable-line no-useless-escape
    /\/gp\/product\/([^\?#\/]+)/i, // eslint-disable-line no-useless-escape
  ];

  let captureGroup;
  const hasAsin = asinRegexs.some((regex) => {
    captureGroup = pathname.match(regex);
    return captureGroup;
  });

  if (!hasAsin) {
    return null;
  }

  const asin = captureGroup[1];
  return asin;
}

module.exports = { getDataFromMessage, extractAsinFromUrl };
