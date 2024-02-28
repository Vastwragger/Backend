/* eslint-disable consistent-return */

const JSONWebToken = require('jsonwebtoken');
const Constants = require('./Constants');
const Config = require('../../config');

function isValidRole(role, roles) {
	let isValid = false;
	roles.forEach((rl) => {
		if (rl.toLowerCase() === role.toLowerCase()) isValid = true;
	});
	return isValid;
}

module.exports = {
	signToken: (id, name, country_code, mobile, role) => {
		const token = JSONWebToken.sign(
			{
				user_id: id,
				name,
				country_code,
				mobile,
				role,
			},
			Config.JWT_SECRET,
			{ expiresIn: Config.TOKEN_EXPIRY },
		);
		return token;
	},

	decodeToken: (req, res, next) => {
		try {
			let token = req.headers.authorization;
			if (token != null && token.indexOf(' ') >= 0) token = token.split(' ')[1];
			let decoded = JSONWebToken.verify(token, Config.JWT_SECRET);
			req.decoded_data = decoded;
			next();
		} catch (err) {
			next();
		}
	},

	anyone: (req, res, next) => {
		const data = req.decoded_data;
		if (data && isValidRole(data.role, Object.values(Constants.ROLES))) {
			next();
		} else {
			return res.status(401).send({
				status: false,
				message: res.__('not_authorized'),
			});
		}
	},

	onlyAdmin: (req, res, next) => {
		const data = req.decoded_data;
		if (data && isValidRole(data.role, [Constants.ROLES.ADMIN])) {
			next();
		} else {
			return res.status(401).send({
				status: false,
				message: res.__('not_authorized'),
			});
		}
	},
};
