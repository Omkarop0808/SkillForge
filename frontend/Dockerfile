FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

# Expose port
EXPOSE 5173

# Dev server
CMD ["npm", "run", "dev", "--", "--host"]
