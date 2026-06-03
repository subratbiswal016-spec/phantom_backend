import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CallLog = sequelize.define('CallLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  callerPhone: {
    type: DataTypes.STRING(15),
    allowNull: false,
    field: 'caller_phone',
  },
  callerName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'caller_name',
  },
  status: {
    type: DataTypes.ENUM('blocked', 'forwarded'),
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in seconds for forwarded calls',
  },
  twilioCallSid: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'twilio_call_sid',
  },
}, {
  tableName: 'call_logs',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['user_id', 'created_at'] },
    { fields: ['caller_phone'] },
  ],
});

export default CallLog;
