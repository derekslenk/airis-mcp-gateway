# ==========================================
# Multi-Stage Build: Vite + React with pnpm
# ==========================================

# ------------------------------
# Stage 1: Build (pnpm + Vite)
# ------------------------------
FROM node:23-alpine AS builder

# pnpm installation
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (generate lockfile if missing)
RUN if [ -f pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile; \
    else \
      pnpm install; \
    fi

# Copy source code
COPY . .

# Build Vite app
RUN pnpm build

# ------------------------------
# Stage 2: Production (nginx)
# ------------------------------
FROM nginx:1.27-alpine

# Copy built assets from builder stage (vite.config.ts: outDir: 'out')
COPY --from=builder /app/out /usr/share/nginx/html

# Custom nginx config for SPA routing
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://api:8000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
