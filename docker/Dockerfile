# Step 1: Build
FROM node:23 AS base

RUN mkdir -p /home/node/app
RUN chown -R node:node /home/node/app
WORKDIR /home/node/app

USER node
COPY --chown=node:node package*.json ./
RUN npm ci

COPY --chown=node:node . .

RUN npm run clean
RUN npm run build

# Step 2: Copy dist and run
FROM node:23 AS app

RUN mkdir -p /home/node/app
RUN chown -R node:node /home/node/app
WORKDIR /home/node/app

USER node
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .
COPY --from=base /home/node/app/dist/ ./dist/

EXPOSE ${PORT}

CMD ["node", "dist/index.js"]

