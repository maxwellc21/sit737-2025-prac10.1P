# Dockerfile

FROM node:18-alpine

WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

ENV PORT=4000
EXPOSE $PORT

CMD ["node", "src/server.js"]
