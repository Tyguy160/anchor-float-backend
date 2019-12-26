# USED FOR SEEDING THE DATABASE

# build with `docker build -f ./backend/prisma/Dockerfile -t dbmigrateandseed ./backend` from the root project dir
# run with `docker run -it --rm --network=associate-engine_default dbmigrateandseed`
# the network will only work if docker-compose is fully up and running
FROM node:10-buster

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

USER node

RUN npm install

COPY --chown=node:node ./prisma/schema.prisma ./prisma/

COPY --chown=node:node ./.env ./

RUN ./node_modules/.bin/prisma2 generate

COPY --chown=node:node . .

# Run the app with node
CMD [ "sh", "-c", "./node_modules/.bin/prisma2 lift save --name initmigration && ./node_modules/.bin/prisma2 lift up && node ./prisma/seed.js" ]
