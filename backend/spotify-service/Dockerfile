FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY ./backend/spotify-service/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY ./backend/spotify-service .

# Expose the service's port
EXPOSE 5001

# Start the application
CMD ["node", "server.js"]
