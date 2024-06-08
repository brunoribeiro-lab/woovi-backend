# Visão Geral

O Woovi-Backend é uma aplicação de backend desenvolvida para fornecer funcionalidades de gerenciamento de contas e transferências de dinheiro entre usuários. Ele é construído usando Node.js e utiliza o framework Express.js. O banco de dados MongoDB é utilizado para armazenar os dados dos usuários e suas transações.

### Funcionalidades Principais

1. Cadastro de Usuários: Os usuários podem se cadastrar na plataforma fornecendo informações como nome, CPF/CNPJ e senha.
2. Autenticação de Usuários: Os usuários podem fazer login na plataforma usando seu CPF/CNPJ e senha.
3. Gerenciamento de Contas: Cada usuário tem uma conta associada a ela, que pode ser usada para armazenar seu saldo e realizar transações.
4. Transferências entre Contas: Os usuários podem transferir dinheiro entre suas contas e as contas de outros usuários.

### Tecnologias Utilizadas

Abaixo está as tecnologias usadas no desenvolvimento desse projeto.

* [Node.js](https://nodejs.org)
* [Express.js](https://expressjs.com)
* [MongoDB](https://www.mongodb.com)
* [Apollo Server Express](https://www.apollographql.com)
* [Jest](https://jestjs.io)

## Começando

Veja abaixo todos os passos para fazer a instalação corretamente da aplicação.

### Instalação Docker

Antes de começar será necessário instalar o [Docker](https://www.docker.com/) no seu servidor/máquina.
com o docker instalado siga os próximos passos abaixo.

1. Clone o repositório
   ```sh
   git clone https://github.com/brunoribeiro-lab/woovi-backend.git
   ```
2. Copie o .env.exemplo para .env e abra o arquivo `.env` e substitua pelas informações corretas:
   ```sh
   cp .env.exemplo .env
   ```
   Defina as configurações no arquivo .env
   ```js
    APP_PORT=3000                   // porta da aplicação
    MONGO_PORT=27017                // porta do MongoDB
    MONGO_DATABASE=woovi            // nome da tabela
    MONGO_IP=mongo                  // host do banco ex: mongo, localhost...
    JWT_SECRET=9Gns8Db?&FejML*u     // chave secreta para JWT (usado no login)
    MAX_LOGIN_TENTATIVAS=5          // máximo de tentativas de login para bloquear o usuário
    LOGIN_BLOQUEAR_DURACAO=2        // tempo em minutos para liberar um usuário com login bloqueado
    TIMEZONE=America/Maceio         // timezone da aplicação
    MAX_REQUEST_TENTATIVAS=5        // máximo de tentativas de requisições com o token inválido
    REQUEST_BLOQUEAR_DURACAO=2      // tempo em minutos para liberar o IP bloqueado devido as tentativas de requisições com token inválido
    JETEST_URL=app                  // URL da aplicação usado nos testes, ex: localhost (caso esteja usando docker use app)
   ```
3. Executando o Docker Composer
   ```sh
   docker-compose up -d --build app
   ```

4. Executando os Testes
   ```sh
   docker-compose run tests
   ```

Portas expostas detalhadas para o .env de exemplo
 
- **node** - `:3000`
- **mongoDB** - `:27017` 

### Contribuindo
Se você quiser contribuir para o projeto Woovi-Backend, siga estas etapas:

1. Faça um fork do repositório.
2. Crie uma branch para sua feature (git checkout -b feature/nova-feature).
3. Faça commit das suas alterações (git commit -am 'Adicionando uma nova feature').
4. Faça push para a branch (git push origin feature/nova-feature).
5. Crie um novo Pull Request.

### Autores

* **Bruno Ribeiro  - [Linkedin](https://www.linkedin.com/in/bruno-ribeiro-46675922a/) - bruno.ribeiro.lab@gmail.com**

### Licença
Distribuído sob a Licença MIT. Veja `LICENSE.md` para mais informações.