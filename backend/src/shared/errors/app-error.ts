export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthSessionExpiredError extends AppError {
  constructor(message: string = 'Sessão expirada. Realize login novamente.') {
    super(message, 401);
    this.name = 'AUTH_SESSION_EXPIRED';
  }
}
