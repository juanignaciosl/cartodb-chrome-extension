function CartoDBAPI() {
  //var protocol = 'http';
  var protocol = 'https';

  //var server = 'localhost.lan:3000';
  //var server = 'cartodb-staging.com';
  var server = 'cartodb.com';

  var importPath = '/api/v1/imports/';

  this.importURL = function(apikey, username, item_queue_id) {
    return protocol + '://' + username + '.' +  server + importPath + item_queue_id + '?' + apikey;
  }

  this.sendCsvURL = function(apikey, username, name) {
    return protocol + '://' + username + '.' + server + importPath + '?filename=' + name + '&api_key=' + apikey + '&content_guessing=true'; 
  }
}

CartoDBAPI.prototype.sendCsv = function(apikey, username, name, csv, callback, errorCallback) {
  var url = this.sendCsvURL(apikey, username, name);
  console.log('url', url);

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
  xhr.send(csv);
}

CartoDBAPI.prototype.loadState = function(apikey, username, tableImport, callback, errorCallback) {
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

CartoDBLocalStorage.prototype.addImport = function(tableImport, callback) {
  this.imports(function(imports) {
    imports.push(tableImport);
    chrome.storage.sync.set({'imports': imports}, callback);
  });
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
  }

  this.imports = function(callback) {
    cartoDBStorage.imports(callback);
  }

  this.loadState = function(tableImport, callback) {
    cartoDBAPI.loadState(apikey, username, tableImport, callback);
  }

  this.addImport = function(importResult, filename, callback) {
    cartoDBStorage.addImport(importResult, filename, callback);
  }

  this.sendCsv = function(name, csv, callback, errorCallback) {
    cartoDBAPI.sendCsv(apikey, username, name, csv, callback, errorCallback);
  }

}
