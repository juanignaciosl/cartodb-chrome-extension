var DEFAULT_APIKEY = '6160385a7c0ee34a5672f3ccb06b417bf9756377';
var DEFAULT_USERNAME = 'chrome-extension-test';

function CartoDBAPI() {
  //var protocol = 'http';
  var protocol = 'https';

  //var server = 'localhost.lan:3000';
  //var server = 'cartodb-staging.com';
  var server = 'cartodb.com';

  var importPath = '/api/v1/imports/';

  var urlRoot = function(username) {
    return protocol + '://' + username + '.' + server;
  }

  var importURLRoot = function(username) {
    return urlRoot(username) + importPath;
  }

  this.importURL = function(apikey, username, item_queue_id) {
    return importURLRoot(username) + item_queue_id + '?' + apikey;
  }

  this.sendCsvURL = function(apikey, username, name) {
    return importURLRoot(username) + '?filename=' + name + '&api_key=' + apikey + '&content_guessing=true'; 
  }

  this.tableURL = function(username, tableImportResult) {
    return urlRoot(username) + '/tables/' + tableImportResult.table_name;
  }
}

CartoDBAPI.prototype.sendCsv = function(apikey, username, name, csv, callback, errorCallback) {
  var url = this.sendCsvURL(apikey, username, name);
  console.log('INFO', 'url', url);

  var xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
  xhr.onreadystatechange = function() { 
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        callback(JSON.parse(xhr.responseText));
      } else {
        errorCallback();
      }
    }
  };
  console.log('INFO', 'sending csv');
  xhr.send(csv);
}

CartoDBAPI.prototype.loadTableImportResult = function(apikey, username, tableImport, callback, errorCallback) {
  var url = this.importURL(apikey, username, tableImport.item_queue_id);
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
  xhr.onreadystatechange = function() { 
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        callback(JSON.parse(xhr.responseText));
      } else {
        if(typeof errorCallback != 'undefined') {
          errorCallback();
        }
      }
    }
  };
  console.log('INFO', 'Requesting import result');
  xhr.send();
}


function CartoDBLocalStorage() {
}

CartoDBLocalStorage.prototype.credentials = function(callback, noCredentialsCallback) {
  chrome.storage.sync.get(['apikey', 'username'], function(value) {
    var apikey = typeof value.apikey === 'undefined' || value.apikey.trim() === '' ? '' : value.apikey.trim();
    var username = typeof value.username === 'undefined' || value.username.trim() === '' ? '' : value.username;

    if(apikey === '' || username === '') {
      noCredentialsCallback();
    } else {
      callback(apikey, username);
    }
  });
}

CartoDBLocalStorage.prototype.setCredentials = function(apikey, username, callback) {
  chrome.storage.sync.set({'apikey': apikey, 'username': username }, callback);
}

CartoDBLocalStorage.prototype.imports = function(callback) {
  chrome.storage.sync.get(['imports'], function(value) {
    var imports = typeof value.imports === 'undefined' ? [] : value.imports;
    callback(imports);
  });
}

CartoDBLocalStorage.prototype.setImports = function(imports, callback) {
  chrome.storage.sync.set({imports: imports}, callback);
}

CartoDBLocalStorage.prototype.addImport = function(tableImport, callback) {
  this.imports(function(imports) {
    imports.push(tableImport);
    chrome.storage.sync.set({'imports': imports}, callback);
  });
}

CartoDBLocalStorage.prototype.tableImportResultId = function(tableImport) {
  return tableImport.item_queue_id + '-tir';  
}

CartoDBLocalStorage.prototype.tableImportResult = function(tableImport, callback) {
  var id = this.tableImportResultId(tableImport);
  chrome.storage.sync.get(id, function(value) {
    var tableImportResult = typeof value[id] === 'undefined' ? null : value[id];
    callback(tableImportResult);
  });
}

CartoDBLocalStorage.prototype.setTableImportResult = function(tableImport, tableImportResult, callback) {
  var savedObject = {};
  savedObject[this.tableImportResultId(tableImport)]  = tableImportResult;
  chrome.storage.sync.set(savedObject, callback);
}


function CartoDB(cartoDBAPI, cartoDBStorage) {

  this.credentials = function(callback, noCredentialsCallback) {
    cartoDBStorage.credentials(function(apikey, username) {
      if(username === DEFAULT_USERNAME) {
        noCredentialsCallback();
      } else {
      callback(apikey, username);
      }
    }, function() {
      setCredentials(DEFAULT_APIKEY, DEFAULT_USERNAME, function() {
        noCredentialsCallback();
      });
    });
  }

  var setCredentials = function(newApikey, newUsername, callback) {
    var processCredentialsChange = function(previousApikey, previousUsername) {
      cartoDBStorage.setCredentials(newApikey, newUsername, function() {
        if(newApikey === '' || newUsername === '' || newApikey != previousApikey || newUsername != previousUsername) {
          cartoDBStorage.setImports([]);
        }

        callback();
      });
    };

    cartoDBStorage.credentials(processCredentialsChange, processCredentialsChange);
  }
  this.setCredentials = setCredentials;

  this.imports = function(callback) {
    cartoDBStorage.imports(callback);
  }

  this.tableImportResult = function(tableImport, callback) {
    cartoDBStorage.tableImportResult(tableImport, function(tableImportResult) {
      if(tableImportResult != null && tableImportResult.state === 'complete') {
        callback(tableImportResult);
      } else {
        cartoDBStorage.credentials(function(apikey, username) {
          cartoDBAPI.loadTableImportResult(apikey, username, tableImport, function(tableImportResult) {
            cartoDBStorage.setTableImportResult(tableImport, tableImportResult);
            callback(tableImportResult);
          });
        });
      }
    });
  }

  this.addImport = function(importResult, filename, callback) {
    cartoDBStorage.addImport(importResult, filename, callback);
  }

  this.sendCsv = function(name, csv, callback, errorCallback) {
    cartoDBStorage.credentials(function(apikey, username) {
      cartoDBAPI.sendCsv(apikey, username, name, csv, callback, errorCallback);
    });
  }

  this.tableURL = function(tableImportResult, callback) {
    cartoDBStorage.credentials(function(apikey, username) {
      callback(cartoDBAPI.tableURL(username, tableImportResult));
    });
  }

}
