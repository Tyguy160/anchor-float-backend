# USED FOR SEEDING THE DATABASE

# build with `docker build -f ./backend/prisma/Dockerfile -t dbmigrateandseed ./backend` from the root project dir
# run with `docker run -it --rm --network=associate-engine_default dbmigrateandseed`
# the network will only work if docker-compose is full up and running

FROM node:10-buster

WORKDIR /opt/app

# docker-compose defines the context as ./backend
COPY ./package.json ./

RUN npm i

COPY ./prisma/schema.prisma ./prisma/

RUN ./node_modules/.bin/prisma2 generate

COPY . .

# Run the app with node
CMD [ "sh", "-c", "./node_modules/.bin/prisma2 lift save --name initmigration && ./node_modules/.bin/prisma2 lift up && node ./prisma/seed.js" ]
