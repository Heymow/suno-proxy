import { MongoClient, ServerApiVersion } from 'mongodb';

let client: MongoClient | null = null;

export async function connectMongo() {
    const uri = process.env.MONGODB_URI || '';
    if (!uri) throw new Error('MONGODB_URI is not set');
    client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });
    await client.connect();
    console.log("Connected to MongoDB");
    return client;
}

export default { connectMongo };