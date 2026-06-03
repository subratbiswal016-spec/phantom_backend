import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const isDev = process.env.NODE_ENV === 'development';

const sequelize = new Sequelize(
  isDev ? 'phantom_dev' : process.env.DB_NAME,
  isDev ? 'user' : process.env.DB_USER,
  isDev ? 'password' : process.env.DB_PASSWORD,
  {
    host: isDev ? 'localhost' : process.env.DB_HOST,
    port: isDev ? 5432 : (process.env.DB_PORT || 5432),
    dialect: isDev ? 'sqlite' : 'postgres',
    storage: isDev ? 'phantom_dev.sqlite' : undefined,
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');
    
    // Sync all models in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('📦 Database models synchronized');
    }
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    throw error;
  }
};

export default sequelize;
