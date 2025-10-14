class SuccessResponse {
  /**
   * @param {string} message
   * @param {any} data (opcional)
   */
  constructor(message, data = null) {
    this.message = message;
    if (data !== null) {
      this.data = data;
    }
  }
}

class ErrorResponse {
  /**
   * @param {string} message
   * @param {string|null} error (opcional)
   */
  constructor(message, error) {
    this.message = message;
    this.error = error;
  }
}

module.exports = {
  SuccessResponse,
  ErrorResponse,
};