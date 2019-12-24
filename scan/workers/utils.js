function getDataFromMessage(messageBody, dataKey) {
  const body = JSON.parse(messageBody);
  if (!(dataKey in body)) {
    console.log(`Key "${dataKey}" not found in message body`);
    return null;
  }
  return body[dataKey];
}

module.exports = { getDataFromMessage };
