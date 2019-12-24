FROM node:10-buster

WORKDIR /opt/app

# docker-compose defines the context as ./backend
COPY ./package.json ./

RUN npm i

# Add the schema so that prisma2 generate works
COPY ./prisma/schema.prisma ./prisma/

RUN ./node_modules/.bin/prisma2 generate

COPY . .

USER node

# Run the app with node
CMD [ "node", "./api/index.js" ]
