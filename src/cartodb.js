function CartoDB(apikey, username) {
  //var protocol = 'http';
  var protocol = 'https';

  //var server = 'localhost.lan:3000';
  //var server = 'cartodb-staging.com';
  var server = 'cartodb.com';

  var importPath = '/api/v1/imports/';

  this.importURL = function(item_queue_id) {
    return protocol + '://' + username + '.' +  server + importPath + item_queue_id + '?' + apikey;
  }
}

CartoDB.prototype.loadState = function(tableImport, callback, errorCallback) {
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
