const Conta = require('../../../models/Conta');
const { ApolloError } = require('apollo-server-errors');

module.exports = {
    Mutation: {
        // remover isso
        criarConta: async (_, { userId }) => {
            // Verificar se o usuário já tem uma conta
            const existingAccount = await Conta.findOne({ userId });
            if (existingAccount) {
                throw new ApolloError('Usuário já possui uma conta', 'ACCOUNT_EXISTS');
            }

            const accountNumber = `ACCT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            const account = new Conta({ accountNumber, userId });
            await account.save();

            return account;
        },
    }
}
