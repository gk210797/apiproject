# Use a Node.js base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy only the `user-service` package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the service port
EXPOSE 5000

# Start the service
CMD ["npm", "start"]
