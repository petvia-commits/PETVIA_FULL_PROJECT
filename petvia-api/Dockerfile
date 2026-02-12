FROM node:20-alpine
WORKDIR /app

# python3 só para o script de import do admin
RUN apk add --no-cache python3

COPY package*.json ./
RUN npm install --omit=dev
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npm","start"]
