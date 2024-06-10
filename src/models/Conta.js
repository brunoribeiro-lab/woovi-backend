const mongoose = require('mongoose');
const { Schema } = mongoose;
const Usuario = require('./Usuario');

const contaSchema = new Schema({
  numeroConta: {
    type: String,
    unique: true,
    required: true
  },
  idUsuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
});

const Conta = mongoose.model('Conta', contaSchema);

module.exports = Conta;
