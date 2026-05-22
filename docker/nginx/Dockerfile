FROM node:22-alpine AS frontend-build

WORKDIR /app

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY site/package*.json ./
RUN npm ci

COPY site/ ./
RUN npm run build

FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/conf.d/uchicode.conf /etc/nginx/conf.d/uchicode.conf
COPY --from=frontend-build /app/dist /usr/share/nginx/html
