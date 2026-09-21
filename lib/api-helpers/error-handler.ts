import { NextResponse } from 'next/server';

/**
 * Standard error response (Django parity)
 */
export function handleError(error: unknown, context: string = 'Operation'): NextResponse {
  console.error(`${context} error:`, error);
  
  // Handle specific error types
  if (error instanceof Error) {
    // Check for MongoDB duplicate key error
    if ((error as any).code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'Duplicate entry detected',
            details: {}
          }
        },
        { status: 409 }
      );
    }
    
    // Check for validation errors
    if ((error as any).name === 'ValidationError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: { message: (error as any).message }
          }
        },
        { status: 400 }
      );
    }
  }
  
  // Default error response (Django parity)
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: {}
      }
    },
    { status: 500 }
  );
}

/**
 * Not found error response (Django parity)
 */
export function handleNotFound(resource: string = 'Resource'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `${resource} not found`,
        details: {}
      }
    },
    { status: 404 }
  );
}

/**
 * Validation error response (Django parity)
 */
export function handleValidationError(message: string, details: any = {}): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        details
      }
    },
    { status: 400 }
  );
}

/**
 * Unauthorized error response (Django parity)
 */
export function handleUnauthorized(message: string = 'Authentication required'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message,
        details: {}
      }
    },
    { status: 401 }
  );
}

/**
 * Forbidden error response (Django parity)
 */
export function handleForbidden(message: string = 'Permission denied'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'PERMISSION_DENIED',
        message,
        details: {}
      }
    },
    { status: 403 }
  );
}

/**
 * Conflict error response (Django parity)
 */
export function handleConflict(message: string = 'Conflict'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'CONFLICT',
        message,
        details: {}
      }
    },
    { status: 409 }
  );
}
