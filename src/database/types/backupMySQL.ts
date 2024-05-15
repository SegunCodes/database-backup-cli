import mysql from 'mysql2';
import fs from 'fs';
import path from 'path';
import { Logger } from '../../Utils/Logger';

function backupMySQL(connection: mysql.Connection, destDir: string) {
    connection.query('SHOW TABLES', (err, results) => {
        if (err) {
            console.error('Error fetching tables:', err);
            Logger.writeLog(`Error fetching tables: ${err.message}`);
            return;
        }

        const tables = (results as mysql.RowDataPacket[]).map((row: mysql.RowDataPacket) => Object.values(row)[0] as string);
        
        tables.forEach((table: string) => {
            const tableFile = path.join(destDir, `${table}.sql`);
            connection.query(`SHOW CREATE TABLE ${table}`, (err, results) => {
                if (err) {
                    console.error(`Error creating table dump for ${table}:`, err);
                    Logger.writeLog(`Error creating table dump for ${table}: ${err.message}`);
                    return;
                }

                fs.writeFileSync(tableFile, (results as mysql.RowDataPacket[])[0]['Create Table'] + ';\n\n');
                
                connection.query(`SELECT * FROM ${table}`, (err, results) => {
                    if (err) {
                        console.error(`Error fetching data from ${table}:`, err);
                        Logger.writeLog(`Error fetching data from ${table}: ${err.message}`);
                        return;
                    }

                    (results as mysql.RowDataPacket[]).forEach((row: mysql.RowDataPacket) => {
                        const keys = Object.keys(row).map(k => `\`${k}\``).join(', ');
                        const values = Object.values(row).map(v => mysql.escape(v)).join(', ');
                        fs.appendFileSync(tableFile, `INSERT INTO ${table} (${keys}) VALUES (${values});\n`);
                    });
                });
            });
        });
    });
}

export { backupMySQL };
