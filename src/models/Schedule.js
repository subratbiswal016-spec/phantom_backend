import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Schedule = sequelize.define('Schedule', {
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
  label: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  daysOfWeek: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false,
    field: 'days_of_week',
    comment: '1=Mon, 7=Sun',
  },
  startTime: {
    type: DataTypes.STRING(5),
    allowNull: false,
    field: 'start_time',
    comment: 'Format: HH:mm',
  },
  endTime: {
    type: DataTypes.STRING(5),
    allowNull: false,
    field: 'end_time',
    comment: 'Format: HH:mm',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'schedules',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_active'] },
  ],
});

export default Schedule;
