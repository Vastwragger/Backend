/* eslint-disable no-undef */
const config = require('../config');
const Constants = require('../api/utils/Constants');
config.ENV = Constants.ENV_TYPES.TEST;
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const TestUtil = require('./Test.Util');

const GeneralService = require('../services/GeneralService');
const UserService = require('../services/UserService');
const GeneralTestData = require('./data/Test.General.json');
const UserTestData = require('./data/Test.User.json');
const { Users } = require('./../api/models');

describe('Ping User Service', () => {
	it('Get /api/user/ping', async () => {
		await TestUtil.sleep(5000);
		chai.request(UserService)
			.get('/api/user/ping')
			.end((err, res) => {
				TestUtil.expectSuccessResponse(err, res);
			});
	});
});

describe('User Service', () => {
	let user = {};
	let loggedInUser = {};

	before(async () => {
		const res = await chai
			.request(GeneralService)
			.post('/api/login')
			.set('Accept', 'application/json')
			.send(GeneralTestData.loginCredentials);
		accessToken = res.body.data.token;
		loggedInUser = res.body.data.user;
	});

	describe("User API's", () => {
		it('Should create a new user', (done) => {
			chai.request(UserService)
				.post('/api/user')
				.set('authorization', `Bearer ${accessToken}`)
				.send(UserTestData.newUser)
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					expect(res.body.data).to.includes(UserTestData.newUser);
					user = res.body.data;
					done();
				});
		});

		it('Should return list of users', (done) => {
			chai.request(UserService)
				.get('/api/user/all')
				.set('authorization', `Bearer ${accessToken}`)
				.query({
					pageNo: 1,
					pageSize: 10,
				})
				.send(UserTestData.newUser)
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					const userIds = res.body.data.map((i) => i._id);
					expect(userIds).to.includes(user._id);
					done();
				});
		});

		it('Should return user by userId', (done) => {
			chai.request(UserService)
				.get('/api/user')
				.set('authorization', `Bearer ${accessToken}`)
				.query({
					user_id: user._id,
				})
				.send(UserTestData.newUser)
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					expect(res.body.data).to.have.property('_id').to.eql(user._id);
					done();
				});
		});

		it('Should update user status', (done) => {
			chai.request(UserService)
				.patch('/api/user/status')
				.set('authorization', `Bearer ${accessToken}`)
				.send({
					user_id: user._id,
					is_active: true,
					is_deleted: false,
				})
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					done();
				});
		});
	});

	describe("Update user profile details API's", () => {
		it('Should return user profile details', (done) => {
			chai.request(UserService)
				.get('/api/user/profile')
				.set('authorization', `Bearer ${accessToken}`)
				.send(UserTestData.newUser)
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					expect(res.body.data.mobile).to.be.eql(GeneralTestData.loginCredentials.mobile);
					done();
				});
		});

		it('Should update user profile details', (done) => {
			chai.request(UserService)
				.patch('/api/user/profile')
				.set('authorization', `Bearer ${accessToken}`)
				.field('email', UserTestData.updateProfile.email)
				.field('first_name', UserTestData.updateProfile.first_name)
				.field('last_name', UserTestData.updateProfile.last_name)
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					expect(res.body.data.email).to.be.eql(UserTestData.updateProfile.email);
					done();
				});
		});
	});

	describe("Update mobile number API's", () => {
		it('Should send otp to update mobile number', (done) => {
			chai.request(UserService)
				.post('/api/user/send-otp')
				.set('authorization', `Bearer ${accessToken}`)
				.send(UserTestData.sendOtp)
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					done();
				});
		});

		it('Should verify otp sent to update mobile number', (done) => {
			chai.request(UserService)
				.post('/api/user/verify-otp')
				.set('authorization', `Bearer ${accessToken}`)
				.send(UserTestData.verifyOtp)
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					expect(res.body.data.mobile).to.be.eql(UserTestData.sendOtp.mobile);
					done();
				});
		});
	});

	describe("Address API's", () => {
		let address = {};
		it('Should add address', (done) => {
			chai.request(UserService)
				.post('/api/user/address')
				.set('authorization', `Bearer ${accessToken}`)
				.send(UserTestData.address)
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					address = res.body.data.find((i) => i.label === UserTestData.address.label);
					expect(address).to.exist;
					done();
				});
		});

		it('Should update address', (done) => {
			chai.request(UserService)
				.patch('/api/user/address')
				.set('authorization', `Bearer ${accessToken}`)
				.send({ ...address, label: 'test', is_default: true, address_id: address._id })
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					const updatedAddress = res.body.data.find((i) => i._id === address._id);
					// eslint-disable-next-line no-unused-expressions
					expect(updatedAddress.is_default).to.be.true;
					done();
				});
		});

		it('Get all addresses', (done) => {
			chai.request(UserService)
				.get('/api/user/address')
				.set('authorization', `Bearer ${accessToken}`)
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					const updatedAddress = res.body.data.find((i) => i._id === address._id);
					// eslint-disable-next-line no-unused-expressions
					expect(updatedAddress).to.exist;
					done();
				});
		});

		it('Delete address', (done) => {
			chai.request(UserService)
				.delete('/api/user/address')
				.set('authorization', `Bearer ${accessToken}`)
				.query({
					address_id: address._id,
				})
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					done();
				});
		});
	});

	after(async () => {
		// reset to original state of records
		await Users.findByIdAndRemove({ _id: user._id });
		await Users.findByIdAndUpdate(loggedInUser._id, {
			mobile: loggedInUser.mobile,
			email: loggedInUser.email,
		});
	});
});
