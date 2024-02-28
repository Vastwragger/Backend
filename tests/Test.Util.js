const expect = require('chai').expect;
const Constants = require('./../api/utils/Constants');
module.exports = {
	expectSuccessResponse: (_err, res) => {
		expect(res.status).to.be.oneOf([200, 201]);
		expect(res.body).to.have.property('status').eql(true);
		expect(res.body).to.have.property('message');
	},
	expectLoginResponse: (res) => {
		expect(res.body).to.deep.nested.property('data.token');
		expect(res.body).to.deep.nested.property('data.user.cart');
		expect(res.body.data.user.role).to.oneOf(Object.values(Constants.ROLES));
		expect(res.body.data.user.mobile).to.have.length(10);
	},
	sleep: (ms) => {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	},
};
