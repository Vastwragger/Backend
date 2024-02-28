const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const { anyone } = require('../utils/AuthUtil');
const errorHandler = require('../utils/Helper').asyncErrorHandler;

router.get('/ping', errorHandler(OrderController.ping));

router.post('/bag-items', anyone, errorHandler(OrderController.addToBagItems));
router.patch('/bag-items', anyone, errorHandler(OrderController.updateBagItems));
router.get('/bag-items', anyone, errorHandler(OrderController.getBagItems));

router.post('/', anyone, errorHandler(OrderController.placeOrder));
router.get('/', anyone, errorHandler(OrderController.getOrderDetails));
router.get('/list', anyone, errorHandler(OrderController.getOrders));
router.post('/instamojo-webhook', errorHandler(OrderController.instamojoWebhook));
router.post('/verify-payment', anyone, errorHandler(OrderController.verifyPayment));

router.post('/review', anyone, errorHandler(OrderController.postReview));

module.exports = router;
