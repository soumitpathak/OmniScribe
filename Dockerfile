FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY --chown=node:node . .
RUN npm run build

ENV NODE_ENV=production \
    PORT=8080

USER node

EXPOSE 8080

CMD ["npm", "start"]
