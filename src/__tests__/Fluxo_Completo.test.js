import { ApolloServer } from 'apollo-server-express';
import { createTestClient } from 'apollo-server-testing';
import { gql } from 'apollo-server-core';
import resolvers from '../graphql/resolvers';
import typeDefs from '../graphql/typeDefs';
import dotenv from 'dotenv';
import { generate as generateCPF } from 'cpf';
import Chance from 'chance';
import mongoose from 'mongoose';
import axios from 'axios'; 
const Usuario = require('../models/Usuario');
const connectDB = require('../config/db');
const Auth = require('../Utils/Auth');

dotenv.config({ path: '.env' });
beforeAll(async () => {
  await connectDB();
});

let userLogin, userLoginConta, userLogin2, userLogin2Conta, authToken;
// teste de cadastro do primeiro usuário
describe('Cadastro de Usuário 1', () => {
  it('deve cadastrar um novo usuário com sucesso', async () => {
    const chance = new Chance();
    const server = new ApolloServer({ typeDefs, resolvers });
    const { mutate } = createTestClient(server);
    const variables = {
      nome: chance.name(),
      login: generateCPF(),
      senha: 'senha123',
    };

    const mutation = gql`
      mutation CadastroUser($nome: String!, $login: String!, $senha: String!) {
        cadastroUser(nome: $nome, login: $login, senha: $senha) {
          token
          conta {
            id
            numeroConta
            idUsuario
          }
          user {
            id
            nome
            login
            token
          }
        }
      }
    `;

    const response = await mutate({
      mutation,
      variables,
    });

    const { data, errors } = response;

    expect(data).toBeDefined();
    expect(data.cadastroUser).toBeDefined();
    expect(data.cadastroUser.token).toBeDefined();
    expect(data.cadastroUser.user).toBeDefined();
    expect(data.cadastroUser.user.id).toBeDefined();
    expect(data.cadastroUser.user.nome).toBe(variables.nome);
    expect(data.cadastroUser.user.login).toBe(variables.login.replace(/\D/g, ''));
    expect(data.cadastroUser.user.token).toBeDefined();
    expect(data.cadastroUser.conta.id).toBeDefined();
    expect(data.cadastroUser.conta.idempotencyId).toBeDefined();
    expect(data.cadastroUser.conta.numeroConta).toBeDefined();
    expect(data.cadastroUser.conta.idUsuario).toBeDefined();

    // adicionar 100 reais nessa conta para fazer o teste de transferência entre contas
    const userId = data.cadastroUser.user.id;
    const usuario = await Usuario.findById(userId);
    usuario.saldo = mongoose.Types.Decimal128.fromString("100.00");
    await usuario.save();

    const updatedUsuario = await Usuario.findById(userId);
    expect(updatedUsuario.saldo.toString()).toBe("100.00");

    userLogin = variables.login;
    userLoginConta = data.cadastroUser.conta.numeroConta;
    authToken = data.cadastroUser.token;
  });
});
// teste de login com o primeiro usuário
describe('Teste de Login de Usuário 1', () => {
  it('deve fazer login com sucesso e guardar o token', async () => {
    const server = new ApolloServer({ typeDefs, resolvers });
    const { mutate } = createTestClient(server);
    const loginMutation = gql`
      mutation Login($login: String!, $senha: String!) {
        login(login: $login, senha: $senha) {
          token
          user {
            login
            nome
            id
          }
        }
      }
    `;

    const loginVariables = {
      login: userLogin,
      senha: 'senha123',
    };

    const response = await mutate({
      mutation: loginMutation,
      variables: loginVariables,
    });

    const { data } = response;

    expect(data).toBeDefined();
    expect(data.login).toBeDefined();
    expect(data.login.token).toBeDefined();

    authToken = data.login.token;
  });
});

// teste de cadastro do segundo usuário
describe('Cadastro de Usuário 2', () => {
  it('deve cadastrar um novo usuário com sucesso', async () => {
    const chance = new Chance();
    const server = new ApolloServer({ typeDefs, resolvers });
    const { mutate } = createTestClient(server);
    const variables = {
      nome: chance.name(),
      login: generateCPF(),
      senha: 'senha123',
    };

    const mutation = gql`
      mutation CadastroUser($nome: String!, $login: String!, $senha: String!) {
        cadastroUser(nome: $nome, login: $login, senha: $senha) {
          token
          conta {
            id
            numeroConta
            idUsuario
          }
          user {
            id
            nome
            login
            token
          }
        }
      }
    `;
    const response = await mutate({
      mutation,
      variables,
    });

    const { data, errors } = response;

    expect(data).toBeDefined();
    expect(data.cadastroUser).toBeDefined();
    expect(data.cadastroUser.token).toBeDefined();
    expect(data.cadastroUser.user).toBeDefined();
    expect(data.cadastroUser.user.id).toBeDefined();
    expect(data.cadastroUser.user.nome).toBe(variables.nome);
    expect(data.cadastroUser.user.login).toBe(variables.login.replace(/\D/g, ''));
    expect(data.cadastroUser.user.token).toBeDefined();
    expect(data.cadastroUser.conta.id).toBeDefined();
    expect(data.cadastroUser.conta.idempotencyId).toBeDefined();
    expect(data.cadastroUser.conta.numeroConta).toBeDefined();
    expect(data.cadastroUser.conta.idUsuario).toBeDefined();

    userLogin2 = variables.login;
    userLogin2Conta = data.cadastroUser.conta.numeroConta
  });
});

// teste do primeiro usuário mandando uma transferência para o segundo usuário
describe('Transferência de R$ 50 reais do Usuário 1 para o Usuário 2', () => {
  it('deve transferir R$ 50 para o segundo usuário com sucesso', async () => {
    const variables = {
      remetenteId: userLoginConta,
      destinatarioId: userLogin2Conta,
      valor: '50.00',
    };
    const headers = {
      Authorization: `${authToken}`,
      'Content-Type': 'application/json',
    };
    try {
      const response = await axios.post(`http://${process.env.JETEST_URL}:${process.env.APP_PORT}/graphql`, {
        query: `
          mutation CriarTransacao($remetenteId: ID!, $destinatarioId: ID!, $valor: Decimal128!) {
            criarTransacao(remetenteId: $remetenteId, destinatarioId: $destinatarioId, valor: $valor) {
              id
              remetente { 
                idUsuario
                numeroConta
              }
              destinatario { 
                idUsuario
                numeroConta
              }
              idempotencyId
              valor
              data
            }
          }
        `,
        variables: variables,
      }, { headers });

      expect(response.data).toBeDefined();
      expect(response.data.data).toBeDefined();
      expect(response.data.data.criarTransacao).toBeDefined();
      expect(response.data.data.criarTransacao.id).toBeDefined();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  });
});