import mysql from 'mysql2';
import { Client as PgClient } from 'pg';
import { MongoClient } from 'mongodb';
import { backupMySQL } from './types/backupMySQL';
import { backupPostgres } from './types/backupPostgres';
import { backupMongoDB } from './types/backupMongoDB';
import fs from 'fs';

// Function to ensure the destination directory exists
function ensureDirectoryExists(directory: string) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

function performBackup(connection: mysql.Connection | PgClient | MongoClient, dbType: string, dbConfig: any) {
    const destDir = dbConfig.destination;
    const database = dbConfig.database;

    // Ensure the destination directory exists before starting the backup
    ensureDirectoryExists(destDir);

    switch (dbType) {
        case 'mysql':
            backupMySQL(connection as mysql.Connection, destDir);
            break;
        case 'pgsql':
            backupPostgres(connection as PgClient, destDir);
            break;
        case 'mongodb':
            backupMongoDB(connection as MongoClient, destDir, database);
            break;
        default:
            console.error('Unsupported database type');
    }
}

export { performBackup };
