# WellBeingVision — sito Astro + TinaCMS (immagine produzione)
# Il bootstrap copia questo file in repos/108vision/aia-website/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# TinaCMS genera i file statici del CMS, poi Astro builda il sito
RUN npx tinacms build && npx astro build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
