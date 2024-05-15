import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { Logger } from '../../Utils/Logger';

async function backupMongoDB(client: MongoClient, destDir: string, database: string) {
    try {
        await client.connect();
        const db = client.db(database);
        const collections = await db.listCollections().toArray();

        for (const collection of collections) {
            const collectionName = collection.name;
            const collectionFile = path.join(destDir, `${collectionName}.json`);
            const data = await db.collection(collectionName).find().toArray();
            fs.writeFileSync(collectionFile, JSON.stringify(data, null, 2));
        }

        console.log(`Backup for MongoDB database ${database} completed.`);
    } catch (err) {
        if (err instanceof Error) {
            console.error('Error during MongoDB backup:', err);
            Logger.writeLog(`Error during MongoDB backup: ${err.message}`);
        } else {
            console.error('Unknown error during MongoDB backup', err);
            Logger.writeLog('Unknown error during MongoDB backup');
        }
    } finally {
        await client.close();
    }
}

export { backupMongoDB };
