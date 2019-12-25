const { Photon } = require('@prisma/photon');

function getDB() {
  try {
    const db = new Photon();
    return db;
  } catch (e) {
    console.error(e);
    console.error('Error creating Photon object. Exiting...\n');
    process.exit(1);
    return null;
  }
}
module.exports = { getDB };
