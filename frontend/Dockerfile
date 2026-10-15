# Build: the Vite app, pointing at the API behind the same nginx (/api).
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts scripts
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Serve: nginx with the static files, proxying /api to the API container.
FROM nginx:1.27-alpine
RUN apk add --no-cache openssl
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY self-signed-cert.sh /docker-entrypoint.d/10-self-signed-cert.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80 443
