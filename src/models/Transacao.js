const mongoose = require('mongoose');
const { Schema } = mongoose;
const Conta = require('./Conta');

const transacaoSchema = new Schema({
  remetente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conta',
    required: true
  },
  destinatario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conta',
    required: true
  },
  idempotencyId: {
    type: String,
    unique: true,
    required: true
  },
  valor: {
    type: mongoose.Decimal128,
    required: true
  },
  data: {
    type: Date,
    default: Date.now
  }
});

const Transacao = mongoose.model('Transacao', transacaoSchema);

module.exports = Transacao;
