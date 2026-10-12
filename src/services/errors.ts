export type ErrorDetails = { field: string } | null;

export type ErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details: ErrorDetails;
  };
};

export class AppError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  readonly details: ErrorDetails;

  constructor(
    code: string,
    httpStatus: number,
    message: string,
    details: ErrorDetails = null,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

export function asAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  return new AppError("INTERNAL", 500, "Something went wrong.", null);
}

export function errorEnvelope(error: AppError): ErrorEnvelope {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
  };
}

export function errorResponse(error: AppError): Response {
  return Response.json(errorEnvelope(error), { status: error.httpStatus });
}
