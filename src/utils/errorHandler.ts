import { DatabaseError } from './errors.js';
import { MongoError } from 'mongodb';

export function handleMongoError(operation: string, resource: string, error: unknown): never {
    // MongoDB errors
    if (error instanceof MongoError) {
        switch (error.code) {
            case 11000: // duplication error (unique index)
                throw new DatabaseError(operation, resource, error, `Duplicate key error for ${resource}`);
            case 121: // schema validation error
                throw new DatabaseError(operation, resource, error, `Schema validation failed for ${resource}`);
            default:
                throw new DatabaseError(operation, resource, error);
        }
    }

    // Autres types d'erreurs
    throw new DatabaseError(
        operation,
        resource,
        error instanceof Error ? error : new Error(String(error))
    );
}