/* eslint-disable no-process-exit */
/* eslint-disable no-console */
const InitDB = require('./initDB');
const { Users } = require('../api/models');
const Inquirer = require('inquirer');
const Helper = require('../api/utils/Helper');
const Constants = require('../api/utils/Constants');

const questions = [
	{
		type: 'input',
		name: 'first_name',
		message: 'First name:',
	},
	{
		type: 'input',
		name: 'last_name',
		message: 'Second name:',
	},
	{
		type: 'input',
		name: 'mobile',
		message: 'Mobile Number:',
	},
	{
		type: 'input',
		name: 'password',
		message: 'Password:',
	},
];

async function execute() {
	await InitDB.connect();
	let answers = await Inquirer.prompt(questions);
	const { first_name, last_name, mobile, password } = answers;
	if (!first_name || !last_name || !mobile || !password) {
		console.log('Please enter all the fields');
		return process.exit(0);
	}
	let user_record = await Users.findOne({ mobile: mobile, is_deleted: false }).lean();
	if (user_record) {
		console.log('This mobile number is already in use!');
		return process.exit(0);
	}
	const user = {
		first_name,
		last_name,
		country_code: '+91',
		mobile,
		password: Helper.getHashedPassword(password),
		role: Constants.ROLES.ADMIN,
	};
	await new Users(user).save();
	console.log('Admin account added successfully!');
	return process.exit(0);
}

execute();
