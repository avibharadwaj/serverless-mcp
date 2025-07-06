FROM node:20-alpine
WORKDIR /app

# Copy only package files first for layer caching
COPY package.json package-lock.json ./

# Install clean dependencies
RUN npm ci

# Now copy the rest of the source code
COPY . .

EXPOSE 3001
CMD ["node", "index.js"]
