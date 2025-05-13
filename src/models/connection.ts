import { MongoClient, ServerApiVersion } from 'mongodb';

let client: MongoClient | null = null;

export async function connectMongo() {
    const uri = process.env.MONGODB_URI || '';
    if (!uri) throw new Error('MONGODB_URI is not set');

    if (client && (await client.db().admin().ping())) {
        console.log("✅ Réutilisation de la connexion MongoDB existante");
        return client;
    }

    client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    await client.connect();
    console.log("✅ Nouvelle connexion à MongoDB établie");
    return client;
}

// Ajouter cette méthode
export function getClient() {
    if (!client) {
        throw new Error("MongoDB client not initialized. Call connectMongo() first");
    }
    return client;
}

// Ajouter cette méthode utilitaire si nécessaire
export function getDb(dbName = "suno") {
    return getClient().db(dbName);
}

export default { connectMongo, getClient, getDb };