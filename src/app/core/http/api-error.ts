export class ApiError extends Error {
  constructor(readonly errors: string[]) {
    super(errors.length > 0 ? errors.join(' ') : 'The API reported a failure.');
  }
}

export class NotFoundError extends ApiError {}
