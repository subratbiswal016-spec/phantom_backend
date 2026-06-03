import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
    validate: { is: /^\+\d{10,15}$/ },
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  firebaseUid: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    field: 'firebase_uid',
  },
  virtualNumber: {
    type: DataTypes.STRING(15),
    allowNull: true,
    unique: true,
    field: 'virtual_number',
  },
  isInvisible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_invisible',
  },
  plan: {
    type: DataTypes.ENUM('free', 'basic', 'pro', 'business'),
    defaultValue: 'free',
  },
  customMessage: {
    type: DataTypes.TEXT,
    defaultValue: 'The number you are trying to reach is currently switched off. Please try again later.',
    field: 'custom_message',
  },
  blockUnknown: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'block_unknown',
  },
  fcmToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'fcm_token',
  },
}, {
  tableName: 'users',
  indexes: [
    { fields: ['phone'] },
    { fields: ['virtual_number'] },
    { fields: ['firebase_uid'] },
  ],
});

export default User;
