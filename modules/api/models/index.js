var sql = require("mssql");


var settings = require('../../../settings.js')


var getTime = function() {
  var d = new Date();

  var minutes = "0" + d.getUTCMinutes()
  var seconds = "0" + d.getUTCSeconds()
  var milliseconds = "0" + d.getUTCMilliseconds()

  return d.getUTCFullYear() +
    '-' + (d.getUTCMonth() + 1) +
    '-' + d.getUTCDate() +
    ' ' + d.getUTCHours() +
    ':' + minutes.substr(-2) +
    ':' + seconds.substr(-2) +
    '.' + milliseconds.substr(-3) +
    ' (GMT +00)'
}
module.exports.status = function(req, callback) {
  //console.log(executeQuery(res, 'select * from [dbo].[DM_ARANYAS_STATUS]')[0])
  sql.connect(settings.dbConfigMsSQL, function(err) {
    if (err) console.log("Error while connecting database :- " + err);
    // create Request object
    var request = new sql.Request();
    // query to the database and get the records
    request.query('select * from [dbo].[DM_ARANYAS_STATUS]').then(function(data) {
      sql.close();
      callback(null, data);
    })
  });
}

module.exports.getStatus = function(nombreAranya, callback) {
  //console.log(executeQuery(res, 'select * from [dbo].[DM_ARANYAS_STATUS]')[0])
  sql.connect(settings.dbConfigMsSQL, function(err) {
    if (err) console.log("Error while connecting database :- " + err);
    // create Request object
    var request = new sql.Request();
    // query to the database and get the records
    request.query('select STATUS from [dbo].[DM_ARANYAS_STATUS] WHERE NAME=\'' + nombreAranya + '\'').then(function(data) {
      sql.close();
      callback(null, data);
    })
  });
}

module.exports.setStatus = function(nombreAranya, newStatus, callback) {
  sql.connect(settings.dbConfigMsSQL, function(err) {
    if (err) console.log("Error while connecting database :- " + err);
    // create Request object
    var request = new sql.Request();
    // query to the database and get the records
    request.query('UPDATE [dbo].[DM_ARANYAS_STATUS] SET status=\'' + newStatus + '\', timestamp=\'' + getTime() + '\' WHERE NAME=\'' + nombreAranya + '\'').then(function(data) {
      // request.query('UPDATE [dbo].[DM_ARANYAS_STATUS] SET status=\'running\' WHERE NAME=\''+nombreAranya+'\'').then(function(data) {

      sql.close();
      callback(null, data);
    })
  });
}

module.exports.setProgress = function(nombreAranya, newProgress, callback) {
  sql.connect(settings.dbConfigMsSQL, function(err) {
    if (err) console.log("Error while connecting database :- " + err);
    // create Request object
    var request = new sql.Request();
    // query to the database and get the records
    request.query('UPDATE [dbo].[DM_ARANYAS_STATUS] SET progress=\'' + newProgress + '\', timestamp=\'' + getTime() + '\' WHERE NAME=\'' + nombreAranya + '\'').then(function(data) {
      // request.query('UPDATE [dbo].[DM_ARANYAS_STATUS] SET status=\'running\' WHERE NAME=\''+nombreAranya+'\'').then(function(data) {

      sql.close();
      // console.log('Progress updated to :' + newProgress);
      callback(null, data);
    })
  });
}
