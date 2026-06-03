import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
let sequelize;

if (isProduction && process.env.DATABASE_URL) {
  // Production PostgreSQL connection (Render default connection string)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  });
} else {
  // Local SQLite connection for development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './phantom_dev.sqlite',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  });
}

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
