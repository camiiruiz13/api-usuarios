class UserNotFoundException extends Error {
  constructor(email) {
    super(`No se encontró el usuario con el correo ${email}.`);
    this.name = 'UserNotFoundException';
  }
}

module.exports = UserNotFoundException;
