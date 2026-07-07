# APIHarbor — backend production build (the image Railway builds).
# The frontend is a Next.js app (./frontend) deployed separately on Vercel;
# it talks to this API server-side, so no SPA is bundled here and no CORS
# configuration is required for it.
#
# Build context must be the repo root:  docker build -t apiharbor .

##############################################################################
# 1) Backend build — compiles the Fastify server (backend/dist)
##############################################################################
FROM node:22.22.0-trixie-slim AS backend-build
WORKDIR /app
# Native module build deps (pkcs11js, TDS/ODBC drivers)
RUN apt-get update && apt-get install -y \
    python3 make g++ openssh-client openssl \
    unixodbc freetds-bin freetds-dev unixodbc-dev libc-dev \
    && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

##############################################################################
# 2) Oracle Instant Client (native driver, downloaded in parallel)
##############################################################################
FROM debian:trixie-slim AS oracle
RUN apt-get update && apt-get install -y unzip wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "amd64" ]; then \
        ORACLE_ZIP="instantclient-basic-linux.x64-23.26.0.0.0.zip" && \
        EXPECTED_SHA="d6c79cbcf0ff209363e779855c690d4fc730aed847e9198a2c439bcf34760af5"; \
    elif [ "$ARCH" = "arm64" ]; then \
        ORACLE_ZIP="instantclient-basic-linux.arm64-23.26.0.0.0.zip" && \
        EXPECTED_SHA="9c9a32051e97f087016fb334b7ad5c0aea8511ca8363afd8e0dc6ec4fc515c32"; \
    fi && \
    ORACLE_URL="https://download.oracle.com/otn_software/linux/instantclient/2326000/${ORACLE_ZIP}" && \
    wget -q "$ORACLE_URL" && \
    echo "$EXPECTED_SHA  $ORACLE_ZIP" | sha256sum -c - && \
    mkdir -p /opt/oracle && \
    unzip "$ORACLE_ZIP" -d /opt/oracle && \
    rm "$ORACLE_ZIP"

##############################################################################
# 3) Production node_modules (backend, no dev deps)
##############################################################################
FROM node:22.22.0-trixie-slim AS prod-deps
WORKDIR /app
RUN apt-get update && apt-get install -y \
    python3 make g++ unixodbc freetds-bin freetds-dev unixodbc-dev libc-dev \
    && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./
RUN npm ci --omit=dev

##############################################################################
# 4) Runtime image
##############################################################################
FROM node:22.22.0-trixie-slim
WORKDIR /app

ENV npm_config_cache=/home/node/.npm

# Runtime libraries only (no compilers)
RUN apt-get update && apt-get install -y \
    unixodbc freetds-bin libaio1t64 smbclient curl bash git \
    && curl -1sLf 'https://artifacts-cli.infisical.com/setup.deb.sh' | bash \
    && apt-get update && apt-get install -y infisical=0.43.79 \
    && rm -rf /var/lib/apt/lists/*

RUN printf "[FreeTDS]\nDescription = FreeTDS Driver\nDriver = /usr/lib/x86_64-linux-gnu/odbc/libtdsodbc.so\nSetup = /usr/lib/x86_64-linux-gnu/odbc/libtdsodbc.so\nFileUsage = 1\n" > /etc/odbcinst.ini

# Oracle Instant Client
COPY --from=oracle /opt/oracle /opt/oracle
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "amd64" ]; then \
        ln -sf /lib/x86_64-linux-gnu/libaio.so.1t64 /lib/x86_64-linux-gnu/libaio.so.1; \
    elif [ "$ARCH" = "arm64" ]; then \
        ln -sf /lib/aarch64-linux-gnu/libaio.so.1t64 /lib/aarch64-linux-gnu/libaio.so.1; \
    fi && \
    echo /opt/oracle/instantclient_23_26 > /etc/ld.so.conf.d/oracle-instantclient.conf && \
    ldconfig

# Backend build output + production node_modules
COPY --from=backend-build /app .
RUN rm -rf ./node_modules ./bdd ./e2e-test
COPY --from=prod-deps /app/node_modules ./node_modules

ENV HOST=0.0.0.0
ENV PORT=4000
ENV NODE_ENV=production

HEALTHCHECK --interval=15s --timeout=3s --start-period=30s \
    CMD node healthcheck.js

EXPOSE 4000

# Apply DB migrations, then boot. migrate:latest is idempotent (safe on every start).
CMD ["sh", "-c", "npm run migration:latest && npm start"]
