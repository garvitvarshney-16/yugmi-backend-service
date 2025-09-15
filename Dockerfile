# Use official Node.js LTS image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the code
COPY . .

# Expose the app port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]