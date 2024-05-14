import fs from 'fs';
import path from 'path';

export class Logger {
    private static logsDirectory = path.join(__dirname, '..', 'logs');

    public static initialize() {
        if (!fs.existsSync(this.logsDirectory)) {
            fs.mkdirSync(this.logsDirectory);
        }
    }

    public static writeLog(message: string) {
        const logFilePath = path.join(this.logsDirectory, 'error.log');
        fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
    }
}
