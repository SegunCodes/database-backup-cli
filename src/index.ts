#!/usr/bin/env node

import { Command } from 'commander';
import figlet from 'figlet';
import mysql from 'mysql2';
import pg from 'pg';
import { MongoClient } from 'mongodb'; 
import { Logger } from './Utils/Logger';
import * as readlineSync from 'readline-sync';
import path from 'path';
import { performBackup } from './database/backup';
Logger.initialize();

interface DBConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    port?: number;
    destination: string;
}

// Set up the CLI
const cli = new Command();
console.log(figlet.textSync("DB BACKUP"));
cli
  .version('1.0.0')
  .description('CLI utility for backing up databases')
  .option('-t, --type <type>', 'Database type (mysql, pgsql, mongodb)')
  .option('-d, --destination <path>', 'Destination folder for backup files')
  .parse(process.argv);

const options = cli.opts();

if (!options.type) {
    console.error('Error: Database type (-t, --type) is required');
    cli.help();
    process.exit(1);
}

if (!options.destination) {
    console.error('Error: Destination folder (-d, --destination) is required');
    cli.help();
    process.exit(1);
}

const supportedDatabases = ['mysql', 'pgsql', 'mongodb'];
if (!supportedDatabases.includes(options.type)) {
    console.error(`Error: Database type "${options.type}" is not supported`);
    process.exit(1);
}

function getHiddenInput(prompt: string): string {
    const inputText = readlineSync.question(prompt, {
        hideEchoBack: true 
    });
    return inputText || '';
}

const host = readlineSync.question('Enter hostname: ');
const user = readlineSync.question('Enter username: ');
const database = readlineSync.question('Enter database name: ');
const password: string = getHiddenInput("Enter your password: ");
const destFolder = path.normalize(options.destination);

// Database configuration
const dbConfig: DBConfig = {
    host: host || 'localhost',
    user: user || 'root',
    password:  password || '',
    database: database || '',
    destination: destFolder
};

let connection: mysql.Connection | pg.Client | MongoClient;

async function connectToDatabase() {

    switch (options.type) {
        case 'mysql':
            connection = mysql.createConnection(dbConfig);
            (connection as mysql.Connection).connect((err: any) => {
                if (err) {
                    console.error('Error connecting to database:', err);
                    Logger.writeLog(`Error connecting to database: ${err.message}`);
                    process.exit(1);
                }
                console.log('Connected to database');
                performBackup(connection, options.type, dbConfig);
            });
            break;
        case 'pgsql':
            connection = new pg.Client(dbConfig);
            (connection as pg.Client).connect((err: any) => {
                if (err) {
                    console.error('Error connecting to database:', err);
                    Logger.writeLog(`Error connecting to database: ${err.message}`);
                    process.exit(1);
                }
                console.log('Connected to database');
                performBackup(connection, options.type, dbConfig);
            });
            break;
        case 'mongodb':
            connection = new MongoClient(`mongodb://${dbConfig.host}`);
            try {
                await (connection as MongoClient).connect();
                console.log('Connected to database');
                performBackup(connection, options.type, dbConfig);
            } catch (err: any) {
                console.error('Error connecting to database:', err);
                Logger.writeLog(`Error connecting to database: ${err.message}`);
                process.exit(1);
            }
            break;
        default:
            console.error('Error: Unsupported database type');
            process.exit(1);
    }
}

connectToDatabase();

process.on('SIGINT', () => {
    if (isMySQLConnection(connection)) {
        (connection as mysql.Connection).end();
    } else if (isPostgresClient(connection)) {
        (connection as pg.Client).end();
    } else if (isMongoClient(connection)) {
        (connection as MongoClient).close();
    }
    console.log('Database connection closed');
    process.exit();
});

// Type guards
function isMySQLConnection(conn: any): conn is mysql.Connection {
    return typeof conn.query === 'function';
}


function isPostgresClient(conn: any): conn is pg.Client {
    return conn instanceof pg.Client;
}

function isMongoClient(conn: any): conn is MongoClient {
    return conn instanceof MongoClient;
}
