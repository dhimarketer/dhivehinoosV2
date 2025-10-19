# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM httpd:2.4-alpine

# Copy built app to Apache
COPY --from=build /app/dist /usr/local/apache2/htdocs/

# Copy Apache configuration
COPY apache.conf /usr/local/apache2/conf/extra/httpd-vhosts.conf

# Enable mod_rewrite and mod_headers
RUN sed -i 's/#LoadModule rewrite_module/LoadModule rewrite_module/' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's/#LoadModule headers_module/LoadModule headers_module/' /usr/local/apache2/conf/httpd.conf && \
    echo "Include conf/extra/httpd-vhosts.conf" >> /usr/local/apache2/conf/httpd.conf

# Expose port
EXPOSE 80

CMD ["httpd-foreground"]