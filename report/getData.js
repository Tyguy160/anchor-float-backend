const chalk = require('chalk');

const { getDB } = require('../prisma/db');

const db = getDB();

async function getData(hostnameInput) {
  console.log(`Fetching data for ${hostnameInput}...`);

  const NUM_PAGES_REQUESTED = 100;
  let currentIndex = 0;
  let moreResults = true;

  try {
    let allSiteData = {};
    let newData;
    while (moreResults) {
      // eslint-disable-next-line no-await-in-loop
      newData = await db.sites.findOne({
        where: {
          hostname: hostnameInput,
        },
        include: {
          pages: {
            first: NUM_PAGES_REQUESTED,
            skip: currentIndex,
            include: {
              links: {
                include: { product: true },
              },
            },
          },
        },
      });

      if (newData) {
        // If data has information in it, add to it; otherwise, create data

        if (allSiteData.pages) {
          allSiteData.pages.push(...newData.pages);
        } else {
          allSiteData = newData;
        }

        console.log(`Parsing results page ${currentIndex}`);

        if (newData.pages.length < NUM_PAGES_REQUESTED) {
          moreResults = false;
          console.log(`${chalk.bold.green('Success: ')}Pulled in data from database`);
        } else {
          currentIndex += newData.pages.length;
        }
      } else {
        moreResults = false;
      }
    }

    if (Object.entries(allSiteData).length !== 0 && allSiteData.constructor === Object) {
      // Determine hostname
      const { hostname } = allSiteData;

      console.log(`\nGetting data for ${chalk.blue.bold(hostname)}`);

      console.log('\n******************* Site Summary *******************\n');

      console.log(chalk.bold('Page Statistics'));
      // Display page count
      const pageCount = allSiteData.pages.length;
      console.log(`Total pages: ${chalk.blue.bold(pageCount)}`);

      // Display total word count
      const totalWordCount = allSiteData.pages
        .map(page => page.wordCount)
        .reduce((acc, curr) => acc + curr);
      console.log(`Total word count: ${chalk.blue.bold(totalWordCount)}`);

      // Display average word count per page
      const averageWordCount = (totalWordCount / pageCount).toFixed(1);
      console.log(`Average words per page: ${chalk.blue.bold(averageWordCount)}`);

      console.log(chalk.bold('\nLink Statistics'));
      // Display number of links
      const totalLinks = allSiteData.pages
        .map(page => page.links.length)
        .reduce((acc, curr) => acc + curr);
      console.log(`Total links: ${chalk.blue.bold(totalLinks)}`);

      // Display number of affiliate links
      const affiliateLinks = allSiteData.pages
        .map(page => page.links.filter(link => link.affiliateTagged).length)
        .reduce((acc, curr) => acc + curr);
      console.log(`Affiliate links: ${chalk.blue.bold(affiliateLinks)}`);

      // Display number of available products
      const availableProducts = allSiteData.pages
        .map(
          page => page.links.filter(link => (link.product ? link.product.availability === 'AMAZON' : ''))
            .length,
        )
        .reduce((acc, curr) => acc + curr);
      console.log(`Available product links: ${chalk.green.bold(availableProducts)}`);

      // Display number of third party products
      const thirdPartyProducts = allSiteData.pages
        .map(
          page => page.links.filter(link => (link.product ? link.product.availability === 'THIRDPARTY' : '')).length,
        )
        .reduce((acc, curr) => acc + curr);
      console.log(`3rd party product links: ${chalk.yellow.bold(thirdPartyProducts)}`);

      // Display number of unavailable products
      const unavailableProducts = allSiteData.pages
        .map(
          page => page.links.filter(link => (link.product ? link.product.availability === 'UNAVAILABLE' : '')).length,
        )
        .reduce((acc, curr) => acc + curr);
      console.log(`Unavailable product links: ${chalk.red.bold(unavailableProducts)}`);

      console.log(chalk.bold('\nPercentages'));

      // Display percentage of affiliate links
      const percentAffiliatized = ((affiliateLinks / totalLinks) * 100).toFixed(1);
      console.log(`Affiliate links / Total links: ${chalk.blue.bold(`${percentAffiliatized}%`)}`);

      // Display percentage of available links
      const percentAvailable = ((availableProducts / affiliateLinks) * 100).toFixed(1);
      console.log(
        `Available product links / Affiliate links: ${chalk.green.bold(`${percentAvailable}%`)}`,
      );

      // Display percentage of third party links
      const percentThirdParty = ((thirdPartyProducts / affiliateLinks) * 100).toFixed(1);
      console.log(
        `3rd party product links / Affiliate links: ${chalk.yellow.bold(`${percentThirdParty}%`)}`,
      );

      // Display percentage of unavailable links
      const percentUnavailable = ((unavailableProducts / affiliateLinks) * 100).toFixed(1);
      console.log(
        `Unavailable product links / Affiliate links: ${chalk.red.bold(`${percentUnavailable}%`)}`,
      );

      console.log('\n****************************************************\n');


      return allSiteData.pages;
    }
  } catch (err) {
    console.log(`Error: ${err}`);
  }
}

module.exports = { getData };
