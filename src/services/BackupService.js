import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import util from 'util';

const execAsync = util.promisify(exec);
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

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${dbName}_backup_${timestamp}.sql.gz`;
    const backupFilePath = path.join(backupDir, backupFileName);

    const dumpCommand = `mysqldump -h ${dbHost} -u ${dbUser} -p${dbPassword} ${dbName} | gzip > ${backupFilePath}`;
    
    await execAsync(dumpCommand);
    
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

    const backupFilePath = path.join(backupDir, filename);
    if (!fs.existsSync(backupFilePath)) {
      throw new Error('Backup file not found');
    }

    const restoreCommand = `gunzip < ${backupFilePath} | mysql -h ${dbHost} -u ${dbUser} -p${dbPassword} ${dbName}`;
    await execAsync(restoreCommand);
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
