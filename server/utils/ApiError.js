/* =========================================================
   API ERROR
   Carries an HTTP status code through async handlers.
   ========================================================= */

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);

    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
