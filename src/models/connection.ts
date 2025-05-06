import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

export async function connectMongo() {
    await client.connect();
    console.log("Connected to MongoDB");
    return client;
}

export default { client, connectMongo };