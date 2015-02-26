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
    return importURLRoot(username) + item_queue_id + '?api_key=' + apikey;
  }

  this.sendImportURL = function(apikey, username) {
    return importURLRoot(username) + '?api_key=' + apikey + '&content_guessing=true'; 
  }

  this.sendCsvURL = function(apikey, username, name) {
    return this.sendImportURL(apikey, username) + '&filename=' + name; 
  }

  this.tableURL = function(username, tableImportResult) {
    return urlRoot(username) + '/tables/' + tableImportResult.table_name;
  }
}

CartoDBAPI.prototype.sendCsv = function(apikey, username, name, csv, callback, errorCallback) {
  var url = this.sendCsvURL(apikey, username, name);
  this.xmlHttpRequest(url, callback, errorCallback).send(csv);
}

CartoDBAPI.prototype.sendFileUrl = function(apikey, username, fileUrl, callback, errorCallback) {
  var url = this.sendImportURL(apikey, username);
  this.xmlHttpRequest(url, callback, errorCallback).send('{ "url": "' + fileUrl + '" }');
}

CartoDBAPI.prototype.xmlHttpRequest = function(url, callback, errorCallback) {
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
  return xhr;
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
  console.log('Requesting import result');
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
  var apikey = '';
  var username = '';

  this.credentials = function(callback, noCredentialsCallback) {
    cartoDBStorage.credentials(function(theApikey, theUsername) {
      apikey = theApikey;
      username = theUsername;
      callback(apikey, username);
    }, function() {
      apikey = '';
      username = '';
      noCredentialsCallback();
    });
  }

  this.setCredentials = function(newApikey, newUsername, callback) {
    apikey = newApikey;
    username = newUsername;

    cartoDBStorage.setCredentials(apikey, username, callback);

    if(apikey === '' || username === '') {
      cartoDBStorage.setImports([]);
    }
  }

  this.imports = function(callback) {
    cartoDBStorage.imports(callback);
  }

  this.tableImportResult = function(tableImport, callback) {
    cartoDBStorage.tableImportResult(tableImport, function(tableImportResult) {
      if(tableImportResult != null && tableImportResult.state === 'complete') {
        callback(tableImportResult);
      } else {
        cartoDBAPI.loadTableImportResult(apikey, username, tableImport, function(tableImportResult) {
          cartoDBStorage.setTableImportResult(tableImport, tableImportResult);
          callback(tableImportResult);
        });
      }
    });
  }

  this.addImport = function(importResult, filename, callback) {
    cartoDBStorage.addImport(importResult, filename, callback);
  }

  this.sendCsv = function(name, csv, callback, errorCallback) {
    cartoDBAPI.sendCsv(apikey, username, name, csv, callback, errorCallback);
  }

  this.sendFileUrl = function(fileUrl, callback, errorCallback) {
    cartoDBAPI.sendFileUrl(apikey, username, fileUrl, callback, errorCallback);
  }

  this.tableURL = function(tableImportResult, callback) {
    callback(cartoDBAPI.tableURL(username, tableImportResult));
  }

}
