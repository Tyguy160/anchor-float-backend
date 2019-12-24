
const uuid = require('uuid/v4');
const { getDB } = require('../../prisma/db');
const { getDataFromMessage } = require('./utils');
const productCache = require('../productCache');
const progress = require('../../progress/index');
const { productProducer } = require('../producers');

const db = getDB();

async function createAndConnectProductHandler({ Body }) {
  const asin = getDataFromMessage(Body, 'asin');
  const linkId = getDataFromMessage(Body, 'linkId');

  const jobId = getDataFromMessage(Body, 'jobId');
  const taskId = getDataFromMessage(Body, 'taskId');

  let dbProduct = await db.products.findOne({
    where: {
      asin,
    },
  });

  if (!dbProduct) {
    try {
      dbProduct = await db.products.create({
        data: {
          asin,
        },
      });
    } catch (err) {
      console.log(err);
      throw new Error('There was an error creating a new DB product');
    }
  }

  try {
    await db.links.update({
      where: { id: linkId },
      data: {
        product: {
          connect: {
            id: dbProduct.id,
          },
        },
      },
    });
  } catch (err) {
    console.log(err);
    throw new Error('There was an error updating the given link');
  }

  progress.productConnectCompleted({ jobId, taskId });

  const productIsAlreadyQueued = await productCache.isAlreadyQueued(asin);
  if (productIsAlreadyQueued) {
    return;
  }

  const productUpdatedRecently = await productCache.isRecentlyUpdated(asin);
  if (productUpdatedRecently) {
    return;
  }

  const productFetchTaskId = uuid();

  progress.productFetchAdded({ jobId, taskId: productFetchTaskId });

  productProducer.send(
    [
      {
        id: productFetchTaskId,
        body: JSON.stringify({
          asin,
          jobId,
          taskId: productFetchTaskId,
        }),
      },
    ],
    (err) => {
      if (err) console.log(err);
    },
  );

  productCache.setProductQueued(asin);
}

module.exports = { createAndConnectProductHandler };
