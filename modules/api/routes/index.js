var express = require('express');
var router = express.Router();

var ctrlAranyas = require('../controllers/index');





router.get('/status', ctrlAranyas.status);
// router.get('/runaranya', function(req, res) {
//   var nombreAranya = req.query.nombre;
//   console.log(nombreAranya);
//   ctrlAranyas.runAranya(nombreAranya);
//   res.end();
// });
router.get('/runAranya', ctrlAranyas.runAranya);
router.get('/google',function(req, res) {
  res.send(__dirname);
  // var spawn = require("child_process").spawn;
  // var process = spawn('python',["pythonScript.py"]);

  var myPythonScriptPath = __dirname+'\\pythonScript.py';
  console.log(__dirname);

  // Use python shell
  var PythonShell = require('python-shell');
  var pyshell = new PythonShell(myPythonScriptPath);
  pyshell.on('message', function (message) {
      // received a message sent from the Python script (a simple "print" statement)
      console.log(message);
  });

  // end the input stream and allow the process to exit
  pyshell.end(function (err) {
      if (err){
          throw err;
      }

      console.log('finished');
  });

});
// router.get('/runRepsol', ctrlAranyas.runRepsol);
// router.get('/runRepsol', ctrlAranyas.runRepsol);
// router.get('/runRepsol', ctrlAranyas.runRepsol);
// router.get('/runRepsol', ctrlAranyas.runRepsol);
// router.get('/runRepsol', ctrlAranyas.runRepsol);
// router.get('/runRepsol', ctrlAranyas.runRepsol);



module.exports = router;
