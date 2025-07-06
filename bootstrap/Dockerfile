FROM node:20-alpine
WORKDIR /app
# Install curl
RUN apk add --no-cache curl
# Copy JS scripts and install dependencies
COPY package.json .
COPY package-lock.json .
RUN npm install

COPY createIndex.js .
COPY populate_test.js .
COPY init-elasticsearch.sh .

CMD ["sh", "./init-elasticsearch.sh"]
