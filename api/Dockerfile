FROM node:10-buster

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

USER node

RUN npm install

COPY --chown=node:node ./prisma/schema.prisma ./prisma/

RUN ./node_modules/.bin/prisma2 generate

COPY --chown=node:node . .

CMD [ "node", "./api/index.js" ]
