const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = `mongodb://${process.env.MONGO_IP}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}`;
        await mongoose.connect(mongoURI);
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB', error);
        process.exit(1);
    }
};

module.exports = connectDB;
