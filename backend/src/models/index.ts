import { Sequelize } from 'sequelize';
import * as path from 'path';
import * as fs from 'fs';

const configDatabasePath = path.resolve('src/config', 'database.json');
const configData = fs.readFileSync(configDatabasePath, 'utf-8');
const config = JSON.parse(configData);
const env = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize(config[env] || config[0]);

export { Sequelize, sequelize };
