export class DatabaseError extends Error {
    constructor(
        public readonly operation: string,
        public readonly resource: string,
        public readonly originalError?: Error,
        message?: string
    ) {
        super(message || `Error during ${operation} on ${resource}: ${originalError?.message || 'Unknown error'}`);
        this.name = 'DatabaseError';
        // Preserve stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DatabaseError);
        }
    }
}