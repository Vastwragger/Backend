const express = require('express');
const router = express.Router();
const UserController = require('./../controllers/UserController');
const { onlyAdmin, anyone } = require('./../utils/AuthUtil');
const errorHandler = require('../utils/Helper').asyncErrorHandler;

router.get('/ping', errorHandler(UserController.ping));

router.post('/', errorHandler(UserController.addUser));
router.get('/all', errorHandler(UserController.getUsers));
router.get('/', errorHandler(UserController.getDetailsById));
router.get('/profile', errorHandler(UserController.getProfile));
router.patch('/profile', errorHandler(UserController.updateProfile));
router.patch('/status', errorHandler(UserController.updateUserStatus));

router.post('/send-otp', errorHandler(UserController.sendOTP));
router.post('/verify-otp', errorHandler(UserController.verifyOTP));

router.post('/address', errorHandler(UserController.addAddress));
router.patch('/address', errorHandler(UserController.editAddress));
router.delete('/address', errorHandler(UserController.deleteAddress));
router.get('/address', errorHandler(UserController.getAddresses));

module.exports = router;
