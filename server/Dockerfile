FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy source and build
COPY . ./
RUN npm run build

ENV NODE_ENV=production

EXPOSE 5000

# Use a small entrypoint script that runs prisma migrations then starts the server
COPY ./start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
