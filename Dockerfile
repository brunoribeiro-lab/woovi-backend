FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install 
#RUN npm install -g npm@10.8.1
RUN npm install -g nodemon
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

