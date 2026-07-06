# APIHarbor frontend — standalone production image (split deploy).
# Builds the Vite SPA and serves the static output with nginx.
# Build context = the frontend/ directory (Railway "Root Directory" = /frontend).

##############################################################################
# 1) Build the static SPA
##############################################################################
FROM node:22.22.0-trixie-slim AS build
WORKDIR /app

# tsc + vite need more than the default ~2GB heap on this codebase.
# Without this the build dies with "JavaScript heap out of memory" — which is
# exactly why the Nixpacks auto-build failed on Railway.
ENV NODE_OPTIONS=--max-old-space-size=4096

# Base URL of the backend API, baked into the JS bundle AND the CSP connect-src
# at build time. Railway passes the VITE_API_URL service variable as a build arg
# (leave empty for a same-origin / combined deploy).
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

##############################################################################
# 2) Serve with nginx
##############################################################################
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Railway provides $PORT at runtime; substitute it into the nginx config.
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "sed -i \"s/__PORT__/${PORT}/g\" /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
