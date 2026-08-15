FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY app.ts ./
COPY server.ts ./
COPY src ./src

EXPOSE 5000

CMD ["sh", "-c", "npm run build && npm start"]