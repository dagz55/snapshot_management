# Build stage
FROM node:18-buster AS build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY client/package*.json ./

# Install dependencies
RUN npm ci

# Copy the current directory contents into the container at /app
COPY client/ .
COPY README.md .
COPY CHANGELOG.md .

# Build the app
RUN npm run build

# Production stage
FROM node:18-buster-slim

WORKDIR /app

# Copy built assets from the build stage
COPY --from=build /app/build ./build

# Install serve to run the application
RUN npm install -g serve

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run the app when the container launches
CMD ["serve", "-s", "build", "-l", "3000"]
