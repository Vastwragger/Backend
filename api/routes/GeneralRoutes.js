const express = require('express');
const router = express.Router();
const GeneralController = require('./../controllers/GeneralController');
const SessionsController = require('./../controllers/SessionsController');
const { onlyAdmin, anyone } = require('../utils/AuthUtil');
const errorHandler = require('../utils/Helper').asyncErrorHandler;

router.get('/ping', errorHandler(GeneralController.ping));

router.post('/db-seed', onlyAdmin, errorHandler(GeneralController.seedDatabase));
router.post('/login', errorHandler(SessionsController.login));
router.post('/send-otp', errorHandler(SessionsController.sendOtp));
router.post('/verify-otp', errorHandler(SessionsController.verifyOtp));

router.post('/notification', onlyAdmin, errorHandler(GeneralController.publishNotification));
router.get('/notification', anyone, errorHandler(GeneralController.getNotifications));
router.patch('/notification/viewed', anyone, errorHandler(GeneralController.markAsViewed));
router.delete('/notification', anyone, errorHandler(GeneralController.clearNotifications));

router.post('/banner', onlyAdmin, errorHandler(GeneralController.addBanner));
router.delete('/banner', onlyAdmin, errorHandler(GeneralController.deleteBanner));
router.get('/banner', errorHandler(GeneralController.getBanners));

router.get('/location', errorHandler(GeneralController.getLocationDetails));
router.get('/location/place', errorHandler(GeneralController.getPlaces));

router.get('/reviews', errorHandler(GeneralController.getDashboardReviews));
router.get('/search-items', errorHandler(GeneralController.searchItems));

module.exports = router;
