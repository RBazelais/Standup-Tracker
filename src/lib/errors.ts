// Custom API error class with status codes and user-friendly messages
export class ApiError extends Error {
	status: number;
	userMessage: string;

	constructor(status: number, message: string, userMessage?: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.userMessage = userMessage || this.getDefaultUserMessage(status);
	}

	private getDefaultUserMessage(status: number): string {
		switch (status) {
			case 400:
				return "Invalid request. Please check your input.";
			case 401:
				return "Please sign in to continue.";
			case 403:
				return "You don't have permission to do this.";
			case 404:
				return "The requested item was not found.";
			case 409:
				return "This conflicts with existing data.";
			case 429:
				return "Too many requests. Please wait a moment.";
			case 500:
				return "Something went wrong. Please try again.";
			case 502:
                return "Server connection failed. Please try again."
			case 503:
                return "Service is temporarily down for maintenance."
			case 504:
				return "Service temporarily unavailable. Please try again.";
			default:
				return "An unexpected error occurred.";
		}
	}
}

// Parse API response and throw appropriate error
export async function handleApiResponse<T>(response: Response): Promise<T> {
	if (response.ok) {
		// Handle empty responses (like DELETE)
		const text = await response.text();
		return text ? JSON.parse(text) : (undefined as T);
	}

	// Try to parse error details from response
	let errorDetails: { error?: string; details?: string } = {};
	try {
		errorDetails = await response.json();
	} catch {
		// Response wasn't JSON
	}

	const message = errorDetails.error || response.statusText;
	const userMessage = getUserFriendlyMessage(response.status, message);

	throw new ApiError(response.status, message, userMessage);
}

// Map specific error messages to user-friendly versions
function getUserFriendlyMessage(status: number, message: string): string {
	// Network/auth errors
	if (status === 401) return "Your session expired. Please sign in again.";
	if (status === 403) return "You can only access your own data.";

	// Specific resource errors
	if (message.includes("standup")) {
		if (status === 404) return "This standup note was not found.";
		if (status === 500) return "Failed to save standup. Please try again.";
	}

	if (message.includes("milestone")) {
		if (status === 404) return "This milestone was not found.";
	}

	if (message.includes("sprint")) {
		if (status === 404) return "This sprint was not found.";
	}

	if (message.includes("task")) {
		if (status === 404) return "This task was not found.";
	}

	// Default messages by status
	return new ApiError(status, message).userMessage;
}

// Helper to check if an error is an ApiError
export function isApiError(error: unknown): error is ApiError {
	return error instanceof ApiError;
}

// Get display message from any error
export function getErrorMessage(error: unknown): string {
	if (isApiError(error)) {
		return error.userMessage;
	}
	if (error instanceof Error) {
		return error.message;
	}
	return "An unexpected error occurred.";
}
