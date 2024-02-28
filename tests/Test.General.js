/* eslint-disable prettier/prettier */
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
const TestData = require('./data/Test.General.json');
const path = require('path');
let accessToken = '';

describe('General Service', () => {
	it('Get /api/ping', async () => {
		await TestUtil.sleep(5000);
		chai.request(GeneralService)
			.get('/api/ping')
			.end((err, res) => {
				TestUtil.expectSuccessResponse(err, res);
			});
	});
});

describe('Session Service - Post /api/login', () => {
	it('Should return user data and auth token', async () => {
		chai.request(GeneralService)
			.post('/api/login')
			.send(TestData.loginCredentials)
			.end((err, res) => {
				TestUtil.expectSuccessResponse(err, res);
				TestUtil.expectLoginResponse(res);
			});
	});
});

describe('Session Service - Post /api/send-otp', () => {
	it('Should send otp successfully', async () => {
		chai.request(GeneralService)
			.post('/api/send-otp')
			.send({ mobile: TestData.loginCredentials.mobile })
			.end((err, res) => {
				TestUtil.expectSuccessResponse(err, res);
			});
	});
});

describe('Session Service - Post /api/verify-otp', () => {
	it('Should return user data and auth token', async () => {
		chai.request(GeneralService)
			.post('/api/verify-otp')
			.send(TestData.otpVerification)
			.end((err, res) => {
				TestUtil.expectSuccessResponse(err, res);
				TestUtil.expectLoginResponse(res);
			});
	});
});

describe('Session Service', () => {
	// eslint-disable-next-line func-names
	before(async function () {
		const res = await chai
			.request(GeneralService)
			.post('/api/login')
			.set('Accept', 'application/json')
			.send(TestData.loginCredentials);
		accessToken = res.body.data.token;
	});

	describe('Notifications', () => {
		let notification = {};
		describe('Create Notification', () => {
			it('Should publish the notification with requested data', (done) => {
				chai.request(GeneralService)
					.post('/api/notification')
					.set('authorization', `Bearer ${accessToken}`)
					.send(TestData.notification)
					.end((err, res) => {
						TestUtil.expectSuccessResponse(err, res);
						expect(res.body).to.deep.nested.property('data.is_broadcasted').to.eql(true);
						expect(res.body.data).to.includes(TestData.notification);
						notification = res.body.data;
						done();
					});
			});
		});

		describe('Get Notifications', () => {
			it('Should return the notifications data', (done) => {
				chai.request(GeneralService)
					.get('/api/notification')
					.set('authorization', `Bearer ${accessToken}`)
					.end((err, res) => {
						TestUtil.expectSuccessResponse(err, res);
						expect(res.body.data).to.be.an('array');
						const notificationsIds = res.body.data.map((i) => i._id);
						expect(notificationsIds).to.includes(notification._id);
						done();
					});
			});
		});

		describe('Mark As Viewed', () => {
			it('Should mark the notification as viewed', (done) => {
				chai.request(GeneralService)
					.patch('/api/notification/viewed')
					.set('authorization', `Bearer ${accessToken}`)
					.end((err, res) => {
						TestUtil.expectSuccessResponse(err, res);
						done();
					});
			});
		});

		describe('Delete Notification', () => {
			it('Should delete the notification', (done) => {
				chai.request(GeneralService)
					.delete('/api/notification')
					.query({
						notification_id: notification._id,
					})
					.set('authorization', `Bearer ${accessToken}`)
					.end((err, res) => {
						TestUtil.expectSuccessResponse(err, res);
						done();
					});
			});
		});
	});

	describe('Banner', () => {
		let banner = {};
		describe('Create Banner', () => {
			it('Should create the banner with requested data', (done) => {
				chai.request(GeneralService)
					.post('/api/banner')
					.set('authorization', `Bearer ${accessToken}`)
					.attach('image', path.resolve(__dirname, 'data/images/test-image.png'))
					.end((err, res) => {
						TestUtil.expectSuccessResponse(err, res);
						expect(res.body.data).to.have.property('image').to.be.contains('https://');
						banner = res.body.data;
						done();
					});
			});
		});

		describe('Get Banners', () => {
			it('Should return the banners', (done) => {
				chai.request(GeneralService)
					.get('/api/banner')
					.set('authorization', `Bearer ${accessToken}`)
					.end((err, res) => {
						TestUtil.expectSuccessResponse(err, res);
						expect(res.body.data).to.be.an('array');
						if (res.body.data.length) {
							// eslint-disable-next-line no-unused-expressions
							expect(res.body).to.deep.nested.property('data[0].image').to.be.ok;
						}
						done();
					});
			});
		});

		describe('Delete Banner', () => {
			it('Should delete the banner', (done) => {
				chai.request(GeneralService)
					.get('/api/banner')
					.set('authorization', `Bearer ${accessToken}`)
					.query({
						banner_id: banner._id,
					})
					.end((err, res) => {
						TestUtil.expectSuccessResponse(err, res);
						done();
					});
			});
		});
	});
});
