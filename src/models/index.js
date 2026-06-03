import User from './User.js';
import VipContact from './VipContact.js';
import CallLog from './CallLog.js';
import Schedule from './Schedule.js';

// Associations
User.hasMany(VipContact, { foreignKey: 'user_id', as: 'vipContacts' });
VipContact.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(CallLog, { foreignKey: 'user_id', as: 'callLogs' });
CallLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Schedule, { foreignKey: 'user_id', as: 'schedules' });
Schedule.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export { User, VipContact, CallLog, Schedule };
