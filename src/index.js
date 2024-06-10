const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const Auth = require('./Utils/Auth');

dotenv.config();

const app = express();
const port = 3000;

connectDB();
const server = new ApolloServer({
  typeDefs, 
  resolvers,
  context: async ({ req }) => { 
    const token = req.headers.authorization || '';
    const JWTS = process.env.JWT_SECRET;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const usuarioL = await Auth(token, JWTS, ip);
    return { token, JWTS, usuarioL };
  }
});

server.start().then(() => {
    server.applyMiddleware({ app });
  
    app.listen(port, () => {
      console.log(`Servidor rodando em http://localhost:${port}`);
      console.log(`Servidor GraphQL disponível em http://localhost:${port}${server.graphqlPath}`);
    });
});
