# Use Node 24 (same as your local)
FROM node:24-alpine

# Create app directory
WORKDIR /app

# Copy only package files first (better caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose backend port
EXPOSE 3002

# Start backend using tsx
CMD ["npm", "run", "start"]
