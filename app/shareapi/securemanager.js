const crypto = require('crypto');

class SecureManager {
  generateSalt() {
    return crypto.randomBytes(16).toString('hex');
  }

  hashPassword(password, salt) {
    const hash = crypto.createHmac('sha256', salt);
    hash.update(password);
    const hashedPassword = hash.digest('hex');
    return hashedPassword;
  }
}

module.exports = SecureManager;
