// O jest só define NODE_ENV=test quando a variável está vazia; se o shell
// exportar NODE_ENV=production, o preset transforma o código como produção.
process.env.NODE_ENV = "test";

module.exports = {
  preset: "jest-expo",
};
