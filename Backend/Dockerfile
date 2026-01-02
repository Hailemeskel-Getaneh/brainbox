# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose port (default for Express is often 3000 or 5000, setting 5000)
EXPOSE 5000

# Start command
CMD ["npm", "start"]
