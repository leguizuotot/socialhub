var express = require('express');
var router = express.Router();
var ctrlScrappers = require('../controllers/index');

router.get('/', ctrlScrappers.app);


module.exports = router;
