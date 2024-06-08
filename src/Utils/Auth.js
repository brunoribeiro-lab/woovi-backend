const jwt = require('jsonwebtoken');
const { ApolloError } = require('apollo-server-errors');
const Usuario = require('../models/Usuario');
const Conta = require('../models/Conta');

const ipTentativas = new Map();

const Auth = async (token, JWTS, ip) => {
    if (!token) return null;

    const MAX_TENTATIVAS = process.env.MAX_REQUEST_TENTATIVAS;
    const BLOQUEAR_DURACAO = process.env.REQUEST_BLOQUEAR_DURACAO * 60 * 1000;
    const ipInfo = ipTentativas.get(ip);
    if (ipInfo && ipInfo.bloqueado) {
        const currentTime = Date.now();
        if (currentTime < ipInfo.blockUntil) throw new ApolloError('Muitas tentativas de autenticação falhadas. Tente novamente mais tarde.', 'TOO_MANY_REQUESTS');

        ipTentativas.delete(ip);
    }

    try {
        const decodedToken = jwt.verify(token, JWTS);
        const userId = decodedToken.userId;
        if (!userId) return null;

        usuarioData = await Usuario.findOne({ "_id": userId });
        usuarioConta = await Conta.findOne({ "idUsuario": userId });
        if (!usuarioData || !usuarioConta) return null;

        if (ipInfo) ipTentativas.delete(ip);

        return { 'usuario': usuarioData, 'conta': usuarioConta };
    } catch (error) {
        if (ipInfo) {
            ipInfo.tentativas += 1;
            if (ipInfo.tentativas >= MAX_TENTATIVAS) {
                ipInfo.bloqueado = true;
                ipInfo.blockUntil = Date.now() + BLOQUEAR_DURACAO;
                setTimeout(() => ipTentativas.delete(ip), BLOQUEAR_DURACAO);
            }
        } 
        
        if (!ipInfo) ipTentativas.set(ip, { tentativas: 1, bloqueado: false });
        
        return null;
    }

}

module.exports = Auth;