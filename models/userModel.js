let seqId = 1;
const users = []; // { id, username, email, passwordHash }

function addUser(user) {
  const novo = {
    id: seqId++,
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash, //  guardar o hash, nunca a senha pura
  };
  users.push(novo);
  return novo;
}

function findByUsername(username) {
  return users.find(u => u.username === username) || null;
}

function listUsers() {
  // só para debug/local — não exponha passwordHash
  return users.map(({ passwordHash, ...safe }) => safe);
}

module.exports = {
  addUser,
  findByUsername,
  listUsers,
};
