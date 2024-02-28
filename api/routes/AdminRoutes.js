/* eslint-disable prettier/prettier */
const express = require('express');
const router = express.Router();
const CouponController = require('./../controllers/CouponController');
const CategoryController = require('./../controllers/CategoryController');
const ItemController = require('./../controllers/ItemController');
const ServiceController = require('./../controllers/ServiceController');
const { onlyAdmin } = require('../utils/AuthUtil');
const errorHandler = require('../utils/Helper').asyncErrorHandler;

router.get('/ping', errorHandler(CategoryController.ping));

router.post('/coupon', onlyAdmin, errorHandler(CouponController.addCoupon));
router.patch('/coupon', onlyAdmin, errorHandler(CouponController.updateCoupon));
router.delete('/coupon', onlyAdmin, errorHandler(CouponController.deleteCoupon));
router.get('/coupon', errorHandler(CouponController.getCoupons));
router.post('/coupon/apply', errorHandler(CouponController.applyCoupon));

// category routes
router.post('/category', onlyAdmin, errorHandler(CategoryController.createCategory));
router.get('/category/all', errorHandler(CategoryController.getAll));
router.get('/category', errorHandler(CategoryController.getCategoryById));
router.patch('/category', onlyAdmin, errorHandler(CategoryController.updateCategory));
router.delete('/category', onlyAdmin, errorHandler(CategoryController.deleteCategory));

// item routes
router.post('/item', onlyAdmin, errorHandler(ItemController.createItem));
router.get('/item/all', errorHandler(ItemController.getAll));
router.get('/item', errorHandler(ItemController.getItemById));
router.patch('/item', onlyAdmin, errorHandler(ItemController.updateItem));
router.delete('/item', onlyAdmin, errorHandler(ItemController.deleteItem));

// service routes
router.post('/item/service', onlyAdmin, errorHandler(ServiceController.createService));
router.patch('/item/service', onlyAdmin, errorHandler(ServiceController.updateService));
router.delete('/item/service', onlyAdmin, errorHandler(ServiceController.removeService));

module.exports = router;
