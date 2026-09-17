FROM node:20-alpine

WORKDIR /app

# Copy package manifests and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy server implementation
COPY . .

# MCP Servers communicate via stdio
ENTRYPOINT ["node", "index.js"]
