# Stage 1: Build
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

# Pass VITE_API_BASE_URL as a build argument
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
# Use the build argument during the build process
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]