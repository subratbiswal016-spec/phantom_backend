import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const VipContact = sequelize.define('VipContact', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: { is: /^\+\d{10,15}$/ },
  },
}, {
  tableName: 'vip_contacts',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['user_id', 'phone'], unique: true },
  ],
});

export default VipContact;
