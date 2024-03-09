const Path = require('path');

module.exports = {
	DB_CONNECTED: 1,
	DB_DISCONNECTED: 0,
	DB_CONNECTING: 2,
	DB_DISCONNECTING: 3,

	MONGOOSE_OPTIONS: {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	},

	ROLES: {
		
		ADMIN: 'Admin',
		USER: 'User',
		TAILOR: 'Tailor',
		DELIVERY_BOY: 'DeliveryBoy',
	},

	ENV_TYPES: {
		PROD: 'PROD',
		DEV: 'DEV',
		LOCAL: 'LOCAL',
		TEST: 'TEST',
	},

	FOLDERS: {
		FOLDER_DATA_ROOT: Path.join(__dirname, '../../../app-data'),
		FOLDER_DATA_BACKUP: Path.join(__dirname, '../../../app-data/backups'),
		FOLDER_DATA_LOGS: Path.join(__dirname, '../../../app-data/logs'),
		FOLDER_PUBLIC_FILES: Path.join(__dirname, '../../public/files'),
	},

	NOTIFICATION_TYPES: {
		GENERAL: 'GENERAL',
		ORDER_DETAILS: 'ORDER_DETAILS',
	},

	CATEGORY_TYPES: {
		STITCH: 'STITCH',
		ALTER: 'ALTER',
	},

	CATEGORIES: {
		OTHERS: 'Others',
	},

	DEFAULT_CREDS: {
		MOBILE: '8937014057',
		OTP: '123456',
	},

	DEFAULT_VISITING_CHARGES: 50,

	ORDER_STATUSES: {
		PENDING: 'Pending',
		PAYMENT_FAILED: 'Payment Failed',
		CONFIRMED: 'Confirmed',
		COMPLETED: 'Completed',
	},
};
