FROM node:18-alpine

WORKDIR /app

# Install backend dependencies (package.json lives in backend/)
COPY backend/package*.json ./

RUN npm install --production

# Copy backend source
COPY backend/ ./

# Copy frontend static files into the image
COPY frontend/ ./public/

EXPOSE 3000

CMD ["node", "server.js"]