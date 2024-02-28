/**
 *
 * @param {*} id
 * @return {Boolean}
 */
function validateObjectId(id) {
	const checkObjectIdFormat = /^[0-9a-fA-F]{24}$/;
	return checkObjectIdFormat.test(id);
}

module.exports = {
	validateObjectId,
};
