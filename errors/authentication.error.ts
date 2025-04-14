export class AuthenticationError extends Error {
  public statusCode: number = 401;

  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}
