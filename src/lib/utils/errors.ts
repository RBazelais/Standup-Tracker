// src/lib/utils/errors.ts

/**
 * Safely extract error message from unknown error type
 */
export function getErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === 'string') {
		return error;
	}
	return fallback;
}