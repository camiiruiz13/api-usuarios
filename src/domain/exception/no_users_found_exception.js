class NoUsersFoundException extends Error {
  constructor(message = 'No hay usuarios registrados') {
    super(message);
    this.name = 'NoUsersFoundException';
  }
}

module.exports = NoUsersFoundException;
