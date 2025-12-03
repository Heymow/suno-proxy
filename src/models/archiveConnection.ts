import { MongoClient, ServerApiVersion } from "mongodb";

let archiveClient: MongoClient | null = null;

export async function connectMongoArchive() {
  // Si une connexion existe déjà et est active, la réutiliser
  if (archiveClient) {
    try {
      await archiveClient.db().command({ ping: 1 });
      console.log("✅ Réutilisation de la connexion MongoDB Archive existante");
      return archiveClient;
    } catch {
      console.log("⚠️ Connexion MongoDB Archive existante invalide, tentative de reconnexion...");
    }
  }

  const uri = process.env.MONGODB_URI_ARCHIVE || "";
  if (!uri) throw new Error("MONGODB_URI_ARCHIVE is not set");

  archiveClient = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
  });

  await archiveClient.connect();
  console.log("✅ Nouvelle connexion à ARCHIVE MongoDB établie");
  return archiveClient;
}

export function getArchiveClient() {
  if (!archiveClient) {
    throw new Error(
      "Archive MongoDB client not initialized. Call connectMongoArchive() first"
    );
  }
  return archiveClient;
}

export function getArchiveDb(dbName = "suno-archive") {
  return getArchiveClient().db(dbName);
}
