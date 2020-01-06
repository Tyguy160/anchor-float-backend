const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const {
  MAIL_HOST,
  MAIL_PORT,
  MAIL_USER,
  MAIL_PASS,
  MG_API_KEY,
  MG_DOMAIN,
} = process.env;

const auth = {
  auth: {
    api_key: MG_API_KEY,
    domain: MG_DOMAIN,
  },
};

const transport = nodemailer.createTransport(mg(auth));

// TODO: Delete code below this line

Object.entries({
  MAIL_HOST,
  MAIL_PORT,
  MAIL_USER,
  MAIL_PASS,
}).forEach(([varName, varValue]) => {
  if (!varValue) {
    // value is undefined
    console.error(`\nMissing required environment variable: ${varName}\n`); // eslint-disable-line no-console
    process.exit(1);
  }
});

// const transport = nodemailer.createTransport({
//   host: MAIL_HOST,
//   port: MAIL_PORT,
//   auth: {
//     user: MAIL_USER,
//     pass: MAIL_PASS,
//   },
// });

const emailTemplate = text => `
<div className="email" style="
    border: 1px solid black;
    padding: 20px;
    font-family: sans-serif;
    line-height: 2;
    font-size: 20px;
    ">
    <h2>Hello there!</h2>
    <p>${text}</p>
    <p>❤️, Anchor Float</p>
</div>
`;

exports.transport = transport;
exports.emailTemplate = emailTemplate;
