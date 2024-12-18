const jwt = require('jsonwebtoken');

const secretKey = "im>gQ56Cie1£";

const createUserToken = async (user, req, res) => {
  const token = jwt.sign(
    {
      name: user.name,
      id: user._id,
      permissao: user.tipo
    },
    secretKey
  );
  return token
};

module.exports = createUserToken