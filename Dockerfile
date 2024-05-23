FROM node:20.10-alpine

RUN apk add --no-cache tzdata

ENV TZ=Asia/Bangkok

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# Bundle app source
RUN npm install
COPY . .

EXPOSE 5420
CMD [ "node", "server.js" ]
