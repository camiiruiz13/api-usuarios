class EmailAlreadyExistsException extends Error {
  constructor(email) {
    super(`El correo ${email} ya está registrado.`);
    this.name = 'EmailAlreadyExistsException';
    this.email = email;
  }
}

module.exports = EmailAlreadyExistsException;
