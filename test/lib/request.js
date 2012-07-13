var http     = require('http');

var request = function (method, path, data, callback) {
  if (callback === undefined) {
    callback = data;
    data = undefined;
  }

  var options = {
    hostname: '127.0.0.1',
    method: method,
    path: path,
    port: 8012,
    headers: {
      'Content-Type': 'application/json'
    }
  };
    
  var request = http.request(options, function (response) {
    var r = {
      body: '',
      response: response
    };
    
    response.setEncoding('utf8');
    
    response.on('error', function (err) {
      callback(err);
    });
    response.on('data', function (chunk) {
      r.body += chunk;
    });
    response.on('end', function () {
      callback(null, r);
    });
  });
  
  if (data !== undefined) request.write(JSON.stringify(data));
  request.end();
};

module.exports = request;