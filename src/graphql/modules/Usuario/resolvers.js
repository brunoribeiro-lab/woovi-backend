const Usuario = require('../../../models/Usuario');
const Conta = require('../../../models/Conta');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const moment = require('moment-timezone');
const MAX_LOGIN_TENTATIVAS = parseInt(process.env.MAX_LOGIN_TENTATIVAS);
const LOGIN_BLOQUEAR_DURACAO = parseInt(process.env.LOGIN_BLOQUEAR_DURACAO);
const TIMEZONE = process.env.TIMEZONE || 'UTC';
const { ApolloError } = require('apollo-server-errors');
const { v4: uuidv4 } = require('uuid');
const { validarCPF, validarCNPJ } = require('../../../Utils/Validar');

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}; 

module.exports = {
    Mutation: {
        cadastroUser: async (_, { nome, login, senha }) => {
            login = login.replace(/\D/g, '');

            if (!nome || nome.length > 200) {
                throw new ApolloError('Nome é obrigatório e não pode ter mais de 200 caracteres', 'INVALID_NAME');
            }

            if (!login || login.length > 14 || !/^\d{11}$|^\d{14}$/.test(login)) {
                throw new ApolloError('CPF ou CNPJ é obrigatório, não pode ter mais de 14 caracteres, e deve conter apenas números', 'INVALID_LOGIN');
            }

            if (login.length == 11 && !validarCPF(login)) {
                throw new ApolloError('CPF Inválido', 'INVALID_CPF');
            }

            if (login.length === 14 && !validarCNPJ(login)) {
                throw new ApolloError('CNPJ inválido', 'INVALID_CNPJ');
            }

            if (!senha || senha.length < 6) {
                throw new ApolloError('Senha é obrigatória e deve ter pelo menos 6 caracteres', 'INVALID_PASSWORD');
            }

            // Verificar se já existe CPF/CNPJ cadastrado
            const existingUser = await Usuario.findOne({ login });
            if (existingUser) {
                throw new ApolloError('CPF/CNPJ já cadastrado', 'DUPLICATE_LOGIN');
            }

            const user = new Usuario({ nome, login, senha });
            await user.save();

            function gerarNumeroConta() {
                return Math.floor(Math.random() * 10000000000).toString();
            }

            let accountNumber, existingAccount;
            // Verificar se já existe essa conta antes de cadastrar, caso exista, gera outra e outra...
            do {
                accountNumber = gerarNumeroConta();
                existingAccount = await Conta.findOne({ numeroConta: accountNumber });
            } while (existingAccount);

            // Criar uma conta para o usuário
            const account = new Conta({ 
                numeroConta: accountNumber,
                idUsuario: user._id,
            });
            await account.save();
            const token = generateToken(user._id);

            return {
                token,
                user,
                conta: account
            };
        },
        login: async (_, { login, senha }) => {
            login = login.replace(/\D/g, '');
            if (!login || !validator.isLength(login, { max: 14 }) || !validator.matches(login, /^\d{11}$|^\d{14}$/)) {
                throw new ApolloError('CPF ou CNPJ é obrigatório, não pode ter mais de 14 caracteres, e deve conter apenas números', 'INVALID_LOGIN');
            }

            if (!senha || !validator.isLength(senha, { min: 6 })) {
                throw new ApolloError('Senha é obrigatória e deve ter pelo menos 6 caracteres', 'INVALID_PASSWORD');
            }

            const user = await Usuario.findOne({ login });
            if (!user)
                throw new ApolloError('Usuário não encontrado', 'USER_NOT_FOUND');

            const currentTime = moment().tz(TIMEZONE);
            if (user.tentativas >= MAX_LOGIN_TENTATIVAS && moment(user.bloquearAte).tz(TIMEZONE).isAfter(currentTime)) {
                const timeLeft = moment(user.bloquearAte).tz(TIMEZONE).diff(currentTime, 'minutes');
                let mensagemRestante = `Tente novamente em ${timeLeft} minutos.`;
                if (!timeLeft)
                    mensagemRestante = "Tente novamente em alguns segundos";

                throw new ApolloError(`Usuário bloqueado devido a múltiplas tentativas de login. ${mensagemRestante}`, 'ACCOUNT_LOCKED');
            }

            if (!(await user.matchPassword(senha))) {
                user.tentativas++;
                if (user.tentativas >= MAX_LOGIN_TENTATIVAS)
                    user.bloquearAte = moment().tz(TIMEZONE).add(LOGIN_BLOQUEAR_DURACAO, 'minutes').toDate();

                await user.save();
                throw new ApolloError('Credenciais inválidas', 'INVALID_CREDENTIALS');
            }

            try {
                const token = generateToken(user._id);
                user.tentativas = 0;
                user.token = token;
                user.bloquearAte = null;
                await user.save();
                return { token, user };
            } catch (error) {
                throw new ApolloError('Erro ao fazer login', 'LOGIN_ERROR');
            }
        }
    }
}
