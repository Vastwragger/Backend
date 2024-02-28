/* eslint-disable node/no-extraneous-require */

const path = require('path');
const gateway = require('express-gateway');
const config = require('./../config');

process.env.PORT_GATEWAY = config.PORT_GATEWAY;
process.env.PORT_GATEWAY_ADMIN = config.PORT_GATEWAY_ADMIN;
process.env.PORT_GENERAL = config.PORT_GENERAL;
process.env.PORT_USER = config.PORT_USER;
process.env.PORT_ADMIN = config.PORT_ADMIN;
process.env.PORT_ORDER = config.PORT_ORDER;

gateway().load(path.join(__dirname, 'config')).run();
