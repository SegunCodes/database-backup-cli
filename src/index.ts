#!/usr/bin/env node

import { Command } from 'commander';
import figlet from 'figlet';
import mysql from 'mysql2';
import pg from 'pg';
import { MongoClient } from 'mongodb'; 
import { Logger } from './Utils/Logger';
import * as readlineSync from 'readline-sync';
Logger.initialize();

interface DBConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    port?: number;
}

// Set up the CLI
const cli = new Command();
console.log(figlet.textSync("DB BACKUP"));
cli
  .version('1.0.0')
  .description('CLI utility for backing up databases')
  .option('-t, --type <type>', 'Database type (mysql, pgsql, mongodb)')
  .parse(process.argv);

const options = cli.opts();

if (!options.type) {
    console.error('Error: Database type (-t, --type) is required');
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

// Database configuration
const dbConfig = {
    host: host || 'localhost',
    user: user || 'root',
    password:  password || '',
    database: database || '',
};

let connection: mysql.Connection | pg.Client | MongoClient;
switch (options.type) {
    case 'mysql':
        connection = mysql.createConnection(dbConfig);
        break;
    case 'pgsql':
        connection = new pg.Client(dbConfig);
        break;
    case 'mongodb':
        connection = new MongoClient(`mongodb://${dbConfig.host}`);
        break;
    default:
        console.error('Error: Unsupported database type');
        process.exit(1);
}

// Connect to the database
connection.connect((err: any) => {
    if (err) {
        console.error('Error connecting to database:', err);
        Logger.writeLog(`Error connecting to database: ${err.message}`);
        process.exit(1);
    }
    console.log('Connected to database');
    //TODO: IMPLEMENTATION ON CONNECTION HAPPENS HERE
});

process.on('SIGINT', () => {
    if (isMySQLConnection(connection)) {
        connection.end();
    } else if (isPostgresClient(connection)) {
        connection.end();
    } else if (isMongoClient(connection)) {
        connection.close();
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
