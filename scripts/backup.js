import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mysqldump from 'mysqldump';

dotenv.config();

const backupDir = path.join(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function backupDatabase() {
  const dbName = process.env.DB_NAME || 'corepack_erp';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASS || '4212';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `${dbName}_backup_${timestamp}.sql.gz`;
  const backupFilePath = path.join(backupDir, backupFileName);

  console.log(`[Backup Started]: Generating backup for database: ${dbName}...`);

  try {
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
    console.log(`[Backup Success]: Database backed up successfully to ${backupFilePath}`);
  } catch (error) {
    console.error('[Backup Error]: Failed to create database backup.', error.message);
    process.exit(1);
  }
}

backupDatabase();
