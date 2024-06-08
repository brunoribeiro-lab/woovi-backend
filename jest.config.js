module.exports = {
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [],
  setupFilesAfterEnv: ["@babel/register"]
};
