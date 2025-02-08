import { MongoClient, Document } from 'mongodb';
import { DB_CONFIG } from './config';

if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
        client = new MongoClient(process.env.MONGODB_URI);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    client = new MongoClient(process.env.MONGODB_URI);
    clientPromise = client.connect();
}

export { clientPromise };

// Helper function to get database instance
export async function getDb() {
    const client = await clientPromise;
    return client.db(DB_CONFIG.name);
}


export async function getCollection<T extends Document>(name: keyof typeof DB_CONFIG.collections) {
    const db = await getDb();
    return db.collection<T>(DB_CONFIG.collections[name]);
}