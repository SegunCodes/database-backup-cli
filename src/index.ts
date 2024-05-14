#!/usr/bin/env node

import { Command } from 'commander';
interface InterfaceCLI{
    debug?: boolean;
}
import mysql from 'mysql';

// Set up the CLI
const cli = new Command();
cli
  .version('1.0.0')
  .description('CLI utility for backing up a MySQL database')
  .option('-h, --host <hostname>', 'Database host')
  .option('-u, --user <username>', 'Database username')
  .option('-p, --password <password>', 'Database password')
  .option('-d, --database <database>', 'Database name')
  .option('-o, --output <folder>', 'Destination folder')
  .parse(process.argv);

const options = cli.opts();

const { debug } : InterfaceCLI = <InterfaceCLI><unknown>cli;
console.log(debug)

// Database configuration
const dbConfig = {
    host: options.host || 'localhost',
    user: options.user || 'root',
    password: options.password || '',
    database: options.database || '',
};

// Connect to the database
const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to database');
});

// Gracefully close the database connection on process exit
process.on('SIGINT', () => {
  connection.end();
  console.log('Database connection closed');
  process.exit();
});
