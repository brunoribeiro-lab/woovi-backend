const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        maxlength: [200, 'Nome não pode ter mais de 200 caracteres']
    },
    login: {
        type: String,
        required: [true, 'CPF ou CNPJ é obrigatório'],
        unique: true,
        maxlength: [14, 'CPF ou CNPJ não pode ter mais de 14 caracteres'],
        validate: {
            validator: function(v) {
                return /^\d{11}$/.test(v) || /^\d{14}$/.test(v);
            },
            message: props => `${props.value} não é um CPF ou CNPJ válido!`
        }
    },
    saldo: {
        type: mongoose.Decimal128,
        default: 0
    },
    senha: {
        type: String,
        required: [true, 'Senha é obrigatória'],
        minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
        maxlength: [200, 'Senha não pode ter mais de 16 caracteres']
    },
    token: {
        type: String,
        default: null
    },
    tentativas: {
        type: Number,
        default: 0
    },
    bloquearAte: {
        type: Date,
        default: null
    }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('senha')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.senha);
};

module.exports = mongoose.model('Usuario', userSchema);
