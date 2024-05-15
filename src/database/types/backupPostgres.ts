import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { Logger } from '../../Utils/Logger';

function backupPostgres(connection: Client, destDir: string) {
    connection.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'', (err, res) => {
        if (err) {
            console.error('Error fetching tables:', err);
            Logger.writeLog(`Error fetching tables: ${err.message}`);
            return;
        }
        const tables = res.rows.map((row: { table_name: string }) => row.table_name);
        tables.forEach((table: string) => {
            const tableFile = path.join(destDir, `${table}.sql`);
            connection.query(`SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table], (err, res) => {
                if (err) {
                    console.error(`Error fetching table structure for ${table}:`, err);
                    Logger.writeLog(`Error fetching table structure for ${table}: ${err.message}`);
                    return;
                }
                const createTableSQL = generateCreateTableSQL(table, res.rows);
                fs.writeFileSync(tableFile, createTableSQL + ';\n\n');
                connection.query(`SELECT * FROM ${table}`, (err, res) => {
                    if (err) {
                        console.error(`Error fetching data from ${table}:`, err);
                        Logger.writeLog(`Error fetching data from ${table}: ${err.message}`);
                        return;
                    }
                    res.rows.forEach((row: any) => {
                        const keys = Object.keys(row).map(k => `"${k}"`).join(', ');
                        const values = Object.values(row)
                            .map(v => typeof v === 'string' ? connection.escapeLiteral(v) : connection.escapeLiteral(String(v)))
                            .join(', ');
                        fs.appendFileSync(tableFile, `INSERT INTO "${table}" (${keys}) VALUES (${values});\n`);
                    });
                });
            });
        });
    });
}

function generateCreateTableSQL(table: string, columns: any[]): string {
    const columnDefinitions = columns.map(col => `"${col.column_name}" ${col.data_type}`).join(', ');
    return `CREATE TABLE "${table}" (${columnDefinitions})`;
}

export { backupPostgres };
