const { ApolloError } = require('apollo-server-errors');
const { Decimal128 } = require('mongoose').Types;
const { v4: uuidv4 } = require('uuid');
const { isValidObjectId } = require('mongoose');

const Conta = require('../../../models/Conta');
const Transacao = require('../../../models/Transacao');
const Usuario = require('../../../models/Usuario');

const isDecimal = (value) => !isNaN(value) && !isNaN(parseFloat(value));

module.exports = {
  Mutation: {
    criarTransacao: async (_, { remetenteId, destinatarioId, valor }, { usuarioL }) => {
      if (!usuarioL || !usuarioL?.conta?.numeroConta) throw new ApolloError('Token de autenticação inválido ' + usuarioL, 'UNAUTHORIZED');

      if (usuarioL.conta.numeroConta.toString() !== remetenteId) throw new ApolloError('Token de autenticação inválido para o usuário remetente', 'UNAUTHORIZED');

      if (!remetenteId || !destinatarioId || valor == null) throw new ApolloError('Parâmetros remetenteId, destinatarioId e valor são obrigatórios', 'BAD_USER_INPUT');

      if (!remetenteId || !destinatarioId) throw new ApolloError('ID do remetente ou destinatário inválido', 'BAD_USER_INPUT');

      if (!/^\d{10}$/.test(remetenteId) || !/^\d{10}$/.test(destinatarioId)) throw new ApolloError('ID do remetente ou destinatário inválido', 'BAD_USER_INPUT');

      if (!isDecimal(String(valor))) throw new ApolloError('Valor inválido. Deve ser um número decimal', 'BAD_USER_INPUT');

      const valorFormatado = Number(valor).toFixed(2);

      const idempotencyId = uuidv4();
      const transacaoExistente = await Transacao.findOne({ idempotencyId });
      if (transacaoExistente) throw new ApolloError('Transação já realizada com esse idempotencyId');

      const remetente = await Conta.findOne({ 'numeroConta': remetenteId });
      const destinatario = await Conta.findOne({ 'numeroConta': destinatarioId });

      if (!remetente || !destinatario) throw new ApolloError('Remetente ou destinatário não encontrado');

      const remetenteUsuario = await Usuario.findById(remetente.idUsuario);
      const destinatarioUsuario = await Usuario.findById(destinatario.idUsuario);
      if (!remetenteUsuario || !destinatarioUsuario) throw new ApolloError('Remetente ou destinatário não encontrado');

      const saldoRemetente = Decimal128.fromString(remetenteUsuario.saldo.toString());
      const valorDecimal = Decimal128.fromString(valorFormatado);

      if (parseFloat(saldoRemetente.toString()) < parseFloat(valorDecimal.toString())) throw new ApolloError('Saldo insuficiente para realizar a transação');

      const transacao = new Transacao({
        remetente,
        destinatario,
        idempotencyId,
        valor: valorDecimal,
        data: new Date()
      });

      await transacao.save();

      const novoSaldoRemetente = Decimal128.fromString((parseFloat(saldoRemetente.toString()) - parseFloat(valorFormatado)).toFixed(2));
      remetenteUsuario.saldo = novoSaldoRemetente;
      await remetenteUsuario.save();

      const saldoDestinatario = Decimal128.fromString(destinatarioUsuario.saldo.toString());
      const novoSaldoDestinatario = Decimal128.fromString((parseFloat(saldoDestinatario.toString()) + parseFloat(valorFormatado)).toFixed(2));
      destinatarioUsuario.saldo = novoSaldoDestinatario;
      await destinatarioUsuario.save();

      await remetente.save();
      await destinatario.save();

      return transacao;
    },
  }
}
