FROM node:20-alpine

WORKDIR /app

# Dependências
COPY package*.json ./
RUN npm install --production

# Código fonte
COPY . .

# Porta padrão exposta
EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "server.js"]
