var fork = require('child_process').fork;
const path = require('path');
var stringify = require('node-stringify');
var model = require('../models/index')

module.exports.status = function(err, res) {
  model.status(null, function(err, data) {
    // res.write(data);
    res.send(data);
  })
}

module.exports.runAranya = function(req,res) {

  var nombreAranya = req.query.nombre
  var list = req.query.list
  var resumen = {
    nombre: nombreAranya,
    accion: null
  }

  model.getStatus(nombreAranya, function(err, data) {
    if (data[0].STATUS === 'Stopped') {
      resumen.accion = 'La aranya estaba parada. Se ha lanzado la aranya'

      model.setStatus(nombreAranya, 'Running', function(err, data) {
        console.log('Status cambiado');
        res.end();
      })

      worker = fork(path.join(__dirname, '../../workers/'+nombreAranya+'/'+nombreAranya+'_'+list+'.js'))



      worker.on('exit', (code, signal) => {
        model.setStatus(nombreAranya, 'Stopped', function(err, data) {
          console.log('Status cambiado');
          res.end();
        });
        if (signal) {
          console.log(`worker was killed by signal: ` + signal);
        } else if (code !== 0) {
          console.log(`worker exited with error code: ` + code);
        } else {
          console.log('worker success!');
        }
      });

      worker.on('disconnect', () => {
        model.setStatus(nombreAranya, 'Stopped', function(err, data) {
          console.log('Status cambiado');
          res.end();
        });
        // console.log(`${origin}_${list} worker exited`);
        console.log('worker exited');
      });
    } else {
      console.log(nombreAranya + ' already running');
      resumen.accion = 'La aranya ya se esta ejecutando'
      model.setStatus(nombreAranya, 'Stopped', function(err, data) {
        console.log('Status cambiado');
        res.end();
      })
    }
    res.send(resumen)
  })

  // callback(null,resumen)
}
