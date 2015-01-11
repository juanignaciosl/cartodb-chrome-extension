function CartoDBAPI(apikey, username) {
  apikey = typeof apikey === 'undefined' ? '' : apikey;
  username = typeof username === 'undefined' ? '' : username;

  //var protocol = 'http';
  var protocol = 'https';

  //var server = 'localhost.lan:3000';
  //var server = 'cartodb-staging.com';
  var server = 'cartodb.com';

  var importPath = '/api/v1/imports/';

  this.importURL = function(item_queue_id) {
    return protocol + '://' + username + '.' +  server + importPath + item_queue_id + '?' + apikey;
  }

  this.sendCsvURL = function(name) {
    return protocol + '://' + username + '.' + server + importPath + '?filename=' + name + '&api_key=' + apikey + '&content_guessing=true'; 
  }
}

CartoDBAPI.prototype.sendCsv = function(name, csv, callback, errorCallback) {
  var url = this.sendCsvURL(name);
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

CartoDBAPI.prototype.loadState = function(tableImport, callback, errorCallback) {
  var url = this.importURL(tableImport.item_queue_id);
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
