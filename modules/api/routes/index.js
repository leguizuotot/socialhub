var express = require('express');
var router = express.Router();

var ctrlAranyas = require('../controllers/index');


router.get('/', ctrlAranyas.status);
router.get('/status', ctrlAranyas.status);
// router.get('/runaranya', function(req, res) {
//   var nombreAranya = req.query.nombre;
//   console.log(nombreAranya);
//   ctrlAranyas.runAranya(nombreAranya);
//   res.end();
// });
router.get('/runAranya', ctrlAranyas.runAranya);
// router.get('/runRepsol', ctrlAranyas.runRepsol);
// router.get('/runRepsol', ctrlAranyas.runRepsol);
// router.get('/runRepsol', ctrlAranyas.runRepsol);
// router.get('/runRepsol', ctrlAranyas.runRepsol);
// router.get('/runRepsol', ctrlAranyas.runRepsol);
// router.get('/runRepsol', ctrlAranyas.runRepsol);



module.exports = router;
