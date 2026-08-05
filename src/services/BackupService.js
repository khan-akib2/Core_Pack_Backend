import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import mysqldump from 'mysqldump';
import mysql from 'mysql2/promise';
const backupDir = path.join(process.cwd(), 'backups');

class BackupService {
  constructor() {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
  }

  async getBackups() {
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.sql.gz'));
    const backups = files.map(file => {
      const stats = fs.statSync(path.join(backupDir, file));
      return {
        filename: file,
        size: stats.size,
        createdAt: stats.birthtime
      };
    });
    return backups.sort((a, b) => b.createdAt - a.createdAt); // newest first
  }

  async createBackup() {
    const dbName = process.env.DB_NAME || 'corepack_erp';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASS || '4212';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${dbName}_backup_${timestamp}.sql.gz`;
    const backupFilePath = path.join(backupDir, backupFileName);

    await mysqldump({
      connection: {
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        port: dbPort,
      },
      dumpToFile: backupFilePath,
      compressFile: true,
    });
    
    // Verify backup
    const stats = fs.statSync(backupFilePath);
    if (stats.size < 100) {
      fs.unlinkSync(backupFilePath);
      throw new Error('Backup verification failed: File too small (likely empty).');
    }
    
    return { filename: backupFileName, size: stats.size, createdAt: stats.birthtime };
  }

  async restoreBackup(filename) {
    const dbName = process.env.DB_NAME || 'corepack_erp';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASS || '4212';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;

    const backupFilePath = path.join(backupDir, filename);
    if (!fs.existsSync(backupFilePath)) {
      throw new Error('Backup file not found');
    }

    const gzippedBuffer = fs.readFileSync(backupFilePath);
    const sqlBuffer = zlib.gunzipSync(gzippedBuffer);
    const sqlString = sqlBuffer.toString('utf8');

    const connection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        port: dbPort,
        multipleStatements: true
    });
    
    try {
      await connection.query(`USE \`${dbName}\``);
      await connection.query(sqlString);
    } finally {
      await connection.end();
    }
    return true;
  }

  async deleteBackup(filename) {
    const backupFilePath = path.join(backupDir, filename);
    if (!fs.existsSync(backupFilePath)) {
      throw new Error('Backup file not found');
    }
    fs.unlinkSync(backupFilePath);
    return true;
  }
}

const backupService = new BackupService();
export default backupService;
