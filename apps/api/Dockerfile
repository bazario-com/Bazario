# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma

# ---- development: fast iteration with volume-mounted source -----------------
FROM base AS development
RUN npm install
RUN npx prisma generate
COPY . .
EXPOSE 4000
CMD ["npm", "run", "start:dev"]

# ---- build: compile TypeScript for production --------------------------------
FROM base AS build
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build

# ---- production: minimal runtime image ---------------------------------------
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate
COPY --from=build /app/dist ./dist

# Run as a non-root user (OWASP container hardening baseline)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 4000
CMD ["node", "dist/main"]
