import { MongoClient, ServerApiVersion } from 'mongodb';

let client: MongoClient | null = null;

export async function connectMongo(maxRetries = 3): Promise<MongoClient> {
    const uri = process.env.MONGODB_URI || '';
    if (!uri) throw new Error('MONGODB_URI is not set');

    // Vérifier si un client existant est déjà connecté
    if (client) {
        try {
            await client.db().admin().ping();
            console.log("✅ Réutilisation de la connexion MongoDB existante");
            return client;
        } catch (error) {
            // La connexion a été perdue, on va en créer une nouvelle
            client = null;
        }
    }

    // Tentatives de connexion avec backoff linéaire
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            client = new MongoClient(uri, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                },
                connectTimeoutMS: 5000,  // Timeout de connexion
                socketTimeoutMS: 45000   // Timeout des opérations
            });

            await client.connect();
            console.log("✅ Nouvelle connexion à MongoDB établie");
            return client;
        } catch (error) {
            client = null;

            if (error instanceof Error && error.name === 'MongoTimeoutError') {
                // Si ce n'est pas la dernière tentative, attendre et réessayer
                if (attempt < maxRetries) {
                    const delayMs = attempt * 1000; // 1s, 2s, 3s, etc.
                    console.error(`Timeout de connexion à MongoDB, tentative ${attempt}/${maxRetries}, nouvelle tentative dans ${delayMs / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    // Continue to next iteration
                } else {
                    console.error(`Échec après ${maxRetries} tentatives de connexion à MongoDB`);
                    throw error;
                }
            } else {
                // Pour les autres types d'erreurs, échouer immédiatement
                console.error(`Erreur de connexion MongoDB: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
                throw error;
            }
        }
    }

    // Cette ligne ne devrait jamais être atteinte grâce au throw dans la boucle
    throw new Error(`Échec de connexion à MongoDB après ${maxRetries} tentatives`);
}

export function getClient() {
    if (!client) {
        throw new Error("MongoDB client not initialized. Call connectMongo() first");
    }
    return client;
}

export function getDb(dbName = "suno") {
    return getClient().db(dbName);
}

export async function closeMongoConnection() {
    if (client) {
        await client.close();
        client = null;
        console.log("MongoDB connection closed");
    }
}

export default { connectMongo, getClient, getDb, closeMongoConnection };