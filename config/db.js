var envs = require('./env');

module.exports = {
  url: envs.mongoConStr || 'example',
  user: envs.mongoUser || 'example',
  pass: envs.mongoPassword || 'example',
  
  coreapi: "http://10.31.31.32:8080"
};
