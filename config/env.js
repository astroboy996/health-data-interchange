require("dotenv").config({ path: 'config/.env.dev' });

module.exports = {
  // mongodb settings
  mongoConStr: process.env.MONGO_CONNECTION_STRING,
  mongoUser: process.env.MONGO_ENC_USER,
  mongoPassword: process.env.MONGO_ENC_PASSWORD
};
