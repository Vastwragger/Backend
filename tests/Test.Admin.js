/* eslint-disable no-undef */
const config = require('../config');
const Constants = require('../api/utils/Constants');
config.ENV = Constants.ENV_TYPES.TEST;
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const chaiUrl = require('chai-url');
chai.use(chaiUrl);
const expect = chai.expect;
const TestUtil = require('./Test.Util');

const GeneralService = require('../services/GeneralService');
const AdminService = require('../services/AdminService');
const TestData = require('./data/Test.Admin.json');
const GeneralTestData = require('./data/Test.General.json');
const path = require('path');
const { HttpStatusCode } = require('axios');
let accessToken = '';

describe('Ping Admin Service', () => {
	it('Get /api/admin/ping', async () => {
		await TestUtil.sleep(5000);
		chai.request(AdminService)
			.get('/api/admin/ping')
			.end((err, res) => {
				TestUtil.expectSuccessResponse(err, res);
			});
	});
});

describe('Admin Service', () => {
	before(async () => {
		const res = await chai
			.request(GeneralService)
			.post('/api/login')
			.set('Accept', 'application/json')
			.send(GeneralTestData.loginCredentials);
		accessToken = res.body.data.token;
	});

	describe("Coupon API's ", () => {
		let fixedDiscountCoupon = {};
		it('Should create a coupon with fixed discount', (done) => {
			chai.request(AdminService)
				.post('/api/admin/coupon')
				.set('authorization', `Bearer ${accessToken}`)
				.send(TestData.fixedDiscount)
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					fixedDiscountCoupon = res.body.data;
					expect(res.body.data).to.deep.include(TestData.fixedDiscount);
					done();
				});
		});
		let percentageDiscountCoupon = {};
		it('Should create a coupon with percentage discount', (done) => {
			chai.request(AdminService)
				.post('/api/admin/coupon')
				.set('authorization', `Bearer ${accessToken}`)
				.send(TestData.percentageDiscount)
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					percentageDiscountCoupon = res.body.data;
					expect(res.body.data).to.deep.include(TestData.percentageDiscount);
					done();
				});
		});

		it('Should return list of all coupons', (done) => {
			chai.request(AdminService)
				.get('/api/admin/coupon')
				.set('authorization', `Bearer ${accessToken}`)
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					const coupons = res.body.data.filter(
						(c) => c._id === fixedDiscountCoupon._id || c._id === percentageDiscountCoupon._id,
					);
					expect(coupons).to.have.lengthOf(2);
					done();
				});
		});

		it('Should update coupon', (done) => {
			chai.request(AdminService)
				.patch('/api/admin/coupon')
				.set('authorization', `Bearer ${accessToken}`)
				.send({
					...fixedDiscountCoupon,
					coupon_id: fixedDiscountCoupon._id,
					max_usage: 1,
				})
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					expect(res.body.data.max_usage).to.equal(1);
					done();
				});
		});

		it('Should delete coupon with fixed discount', (done) => {
			chai.request(AdminService)
				.delete('/api/admin/coupon')
				.set('authorization', `Bearer ${accessToken}`)
				.query({
					coupon_id: fixedDiscountCoupon._id,
				})
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					done();
				});
		});

		it('Should delete coupon with percentage discount', (done) => {
			chai.request(AdminService)
				.delete('/api/admin/coupon')
				.set('authorization', `Bearer ${accessToken}`)
				.query({
					coupon_id: percentageDiscountCoupon._id,
				})
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					done();
				});
		});
	});

	describe("Category API's ", () => {
		let category = {};
		it('Should create a category with requested data', (done) => {
			chai.request(AdminService)
				.post('/api/admin/category')
				.set('authorization', `Bearer ${accessToken}`)
				.field(TestData.category)
				.attach('image', path.resolve(__dirname, 'data/images/test-image.png'))
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					category = res.body.data;
					expect(category.image).to.have.protocol('https');
					expect(category).to.deep.include(TestData.category);
					done();
				});
		});

		it('Should not create a duplicate category', (done) => {
			chai.request(AdminService)
				.post('/api/admin/category')
				.set('authorization', `Bearer ${accessToken}`)
				.field(TestData.category)
				.attach('image', path.resolve(__dirname, 'data/images/test-image.png'))
				.end((_err, res) => {
					expect(res.status).to.be.equal(HttpStatusCode.Conflict);
					done();
				});
		});

		it('Should return category by id', (done) => {
			chai.request(AdminService)
				.get('/api/admin/category')
				.set('authorization', `Bearer ${accessToken}`)
				.query({
					_id: category._id,
				})
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					expect(category).to.deep.include(category);
					done();
				});
		});

		it('Should return list of all categories', (done) => {
			chai.request(AdminService)
				.get('/api/admin/category/all')
				.set('authorization', `Bearer ${accessToken}`)
				.query({
					type: Constants.CATEGORY_TYPES.STITCH,
				})
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					expect(category).to.deep.include(category);
					done();
				});
		});

		it('Should update category', (done) => {
			chai.request(AdminService)
				.patch('/api/admin/category')
				.set('authorization', `Bearer ${accessToken}`)
				.field({ _id: category._id, name: 'test' })
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					expect(res.body.data.name).to.equal('test');
					done();
				});
		});

		it('Should delete category by id', (done) => {
			chai.request(AdminService)
				.delete('/api/admin/category')
				.set('authorization', `Bearer ${accessToken}`)
				.query({
					_id: category._id,
				})
				.end((err, res) => {
					TestUtil.expectSuccessResponse(err, res);
					done();
				});
		});
	});
});
