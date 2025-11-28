# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files (cached separately - only rebuilds when package files change)
COPY package*.json ./

# Install dependencies (cached layer - only rebuilds when package*.json changes)
RUN npm install --legacy-peer-deps

# Copy source code (this layer rebuilds on code changes, but dependencies stay cached)
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]