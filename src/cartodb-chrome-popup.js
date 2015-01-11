var cartoDB = new CartoDB(new CartoDBAPI(), new CartoDBLocalStorage());

var TABLE_LINK = 'view';

document.addEventListener(
    'DOMContentLoaded', 
    function () {
      byId("save-button").addEventListener('click', saveClicked);
      byId("dismiss-button").addEventListener('click', dismissedClicked);
      byId('menu-image').src = chrome.extension.getURL("menu.png");
      byId('logo-image').src = chrome.extension.getURL("cartodb.png");

      loadInitialData();
    });

window.addEventListener('click',function(e){
    if(e.target.href!==undefined) {
      chrome.tabs.create({url:e.target.href})
    }
});

function loadInitialData() {
  var loadData = function(apikey, username) {
    toggleUnregisteredUserInfo(username === '');
    loadApikeyAndUsername(apikey, username);
    cartoDB.imports(function(imports) {
      loadImports(imports);
    });
  }

  cartoDB.credentials(function(apikey, username) {
    loadData(apikey, username);
  }, function() {
    loadData('', '');
  });
}

function saveClicked() {
  var apikey_field = byId('apikey');
  var username_field = byId('username');

  var error = byId('required-data-error'); 
  var apikey = apikey_field.value.trim();
  var username = username_field.value.trim();
  var hasCredentials = apikey.length > 0 && username.length > 0; 
  if(hasCredentials) {
    save(apikey, username, function() {
      error.style.display = 'none';
      loadInitialData();
    });
  } else {
    error.style.display = 'block';
  }
  toggleUnregisteredUserInfo(hasCredentials);
}

function save(apikey, username, callback) {
  cartoDB.setCredentials(apikey, username, callback);
}

function dismissedClicked() {
  save('', '', function() { window.close(); });
}

function loadApikeyAndUsername(apikeyValue, usernameValue) {
  var apikey = byId('apikey');
  var username = byId('username');

  apikey.value = apikeyValue || '';
  username.value = usernameValue || '';
}

function loadImports(imports) {
  var importList = byId('tableImportList');
  while(importList.hasChildNodes()) {
    importList.removeChild(importList.firstChild);
  }

  imports = imports.sort(function(a, b) {
    return a.timestamp - b.timestamp;
  }).reverse().slice(0, 10);

  for(var i = 0; i < imports.length; i++) {
    var tableImport = imports[i];
    var stateId = 'state-' + tableImport.item_queue_id;
    importList.appendChild(createElement('li', tableImport.filename + '. <a class="state" id="' + stateId + '"></a>'));
    loadState(tableImport, byId(stateId));
  }

  if(imports.length === 0) {
    importList.appendChild(createElement('li', 'No imports yet, let\'s begin!'));
  }

  byId('imports').style.display = 'block';
}

function loadState(tableImport, stateLink) {
  stateLink.innerText = 'Loading...';

  cartoDB.tableImportResult(tableImport, function(tableImportResult) {
    if(tableImportResult != null) {
      stateLink.innerText = tableImportResult.state;

      if(tableImportResult.state === 'complete') {
        cartoDB.tableURL(tableImportResult, function(url) {
          stateLink.innerText = TABLE_LINK;
          stateLink.href = url;
        });
      }
    }
  });
}

function createElement(tagName, html) {
  var li = document.createElement(tagName);
  li.innerHTML = html;
  return li;
}

function toggleUnregisteredUserInfo(show) {
  var defaultUserCredentials = byId('default-user-credentials');
  var instructions = byId('instructions');
  if(show) {
    defaultUserCredentials.style.display = 'block';
    instructions.style.display = 'block';
  } else {
    defaultUserCredentials.style.display = 'none';
    instructions.style.display = 'none';
  }
}
