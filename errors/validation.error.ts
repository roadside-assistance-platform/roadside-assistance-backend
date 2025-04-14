export class ValidationError extends Error {
  public errors: string[];
  public statusCode: number = 400;

  constructor(message: string, errors: string[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
