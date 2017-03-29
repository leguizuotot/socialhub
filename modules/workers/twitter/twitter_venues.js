'use strict';

const database = require('mssql');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const Twitter = require('twitter-node-client').Twitter;

const run = require('../runner.js');
const model = require('./model_venues.js');

// modify behaviour of the doRequest method, only console.log when not child process
Twitter.prototype.doRequest = function doRequest(url, error, success) {
  // Fix the mismatch between OAuth's RFC3986's and
  // Javascript's beliefs in what is right and wrong ;)
  // From https://github.com/ttezel/twit/blob/master/lib/oarequest.js
  const fixedUrl = url.replace(/\!/g, '%21')
                      .replace(/\'/g, '%27')
                      .replace(/\(/g, '%28')
                      .replace(/\)/g, '%29')
                      .replace(/\*/g, '%2A');

  this.oauth.get(fixedUrl, this.accessToken, this.accessTokenSecret, (err, body, response) => {
    if (!process.send) console.log('URL [%s]', fixedUrl);
    if (!err && response.statusCode === 200) {
      success(body);
    } else {
      error(err, response, body);
    }
  });
};

// add a users api call to twitter-node-client
Twitter.prototype.getUsers = function getUsers(params, error, success) {
  const apiUrl = '/users/lookup.json';
  const paramsUrl = this.buildQS(params);
  const url = this.baseUrl + apiUrl + paramsUrl;
  this.doRequest(url, error, success);
};

// Set up config objects

const origin = 'twitter';
const list = 'venues';
const size = 100;

// Configuracion Miguel Serrano ¡¡Cambiar!!
const apiConfig = {
  consumerKey: 'IZbAlPTh7GwmnDXvKQP6pu76q',
  consumerSecret: 'dERq0ZVBsVrhwpv1ehMt86ya9rGx5sWgeWDfBWrUKUzS4c1aNz',
  accessToken: '215681150-rkuRHUTNFhe4u7oweqGOtJ63ptsz3nzcSa8VitFk',
  accessTokenSecret: 'HzNH8uQ6VzCJCsv7oI2KXtLtp1Mulc4ytjnR3eAWBastJ',
  callBackUrl: '',
};

// Set up input data

// const dbConfig = {
//   user: process.env.CSADB_USER,
//   password: process.env.CSADB_PASSWORD,
//   server: process.env.CSADB_SERVER,
//   database: process.env.CSADB_DATABASE,
//   requestTimeout: process.env.CSADB_REQUEST_TIMEOUT,
// };
var dbConfig = require('../../../settings.js').dbConfigMsSQL


database.connect(dbConfig)
.then(() => {
  const pFoursquare = database.query`
    SELECT DISTINCT [contact.twitter]
    FROM [ibc_seg].[V_SOURCE_FOURSQUARE]
    WHERE [contact.twitter] IS NOT NULL`;
  const pManpower = database.query`
    SELECT DISTINCT [idTwitter]
    FROM [ibc_seg].[V_SOURCE_TWITTER_MANPOWER]
    WHERE [idTwitter] <> ''`;

  return Promise.all([pFoursquare, pManpower]);
})
.then((values) => {
  const foursquare = values[0].map(row => row['contact.twitter']);
  const manpower = values[1].map(row => row.idTwitter);

  const once = JSON.parse(fs.readFileSync(path.join(__dirname, './input/11870.json')));
  const buscor = JSON.parse(fs.readFileSync(path.join(__dirname, './input/buscorestaurantes.json')));
  const manual = JSON.parse(fs.readFileSync(path.join(__dirname, './input/manual.json')));

  const total = [...foursquare, ...once, ...buscor, ...manpower, ...manual];
  const chunks = [];
  while (total.length) {
    chunks.push(total.splice(0, 99));
  }
  const input = chunks
    .map((chunk, index) => Object.assign({ chunk }, {
      name: `Chunk ${index}: `,
      cluster: chunk.join(','),
      section: null,
    }));

  // Set up handlers

  function handleGet({ cluster }) {
    const twitter = new Twitter(apiConfig);

    return new Promise((resolve, reject) => {
      twitter.getUsers(
        { screen_name: cluster },
        (err, response, body) => {
          if (err.statusCode === 404) resolve({ statusCode: err.statusCode, body });
          else reject({ statusCode: err.statusCode, body });
        },
        data => resolve({ statusCode: 200, body: JSON.parse(data) })
      );
    })
    .catch(error => ({ error, source: 'handleGet' }));
  }

  function handleResponse(item, response, done) {
    const { cluster, section } = item;
    const datetime = new Date().toISOString();

    if (response.statusCode === 200) {
      return response.body
        .map((row) => {
          // last opportunity to modify response objects
          const newRow = row;
          newRow.status = {
            created_at: newRow.created_at,
            id: newRow.id,
            id_str: newRow.id_str,
            text: newRow.text,
            truncated: newRow.truncated,
            geo: newRow.geo,
            coordinates: newRow.coordinates,
            place: newRow.place,
            retweet_count: newRow.retweet_count,
            favorite_count: newRow.favorite_count,
            favorited: newRow.favorited,
            retweeted: newRow.retweeted,
          };
          delete newRow.entities;
          return newRow;
        })
        .map((row, index) => _.merge({}, model, row, { cluster, section, index, datetime }))
        .filter(row => done.indexOf(row.id.toString()) === -1);
    }

    if (response.statusCode === 404) {
      return [];
    }

    return { error: response, source: 'handleResponse' };
  }

  // Run

  run({
    config: { origin, list, size },
    data: { input, model },
    handlers: { handleGet, handleResponse },
  });
})
.catch(err => console.log(err));
