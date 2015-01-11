var cartoDBAPI;
var cartoDBStorage = new CartoDBLocalStorage();

document.addEventListener(
    'DOMContentLoaded', 
    function () {
      document.getElementById("save-button").addEventListener('click', saveClicked);
      document.getElementById("dismiss-button").addEventListener('click', dismissedClicked);
      document.getElementById('menu-image').src = chrome.extension.getURL("menu.png");
      document.getElementById('logo-image').src = chrome.extension.getURL("cartodb.png");

      loadInitialData();
    });

window.addEventListener('click',function(e){
    if(e.target.href!==undefined) {
      chrome.tabs.create({url:e.target.href})
    }
});

function loadInitialData() {
  cartoDBStorage.credentials(function(apikey, username) {
    cartoDBAPI = new CartoDBAPI(apikey, username);
    toggleInstructions(false);
    loadApikeyAndUsername(apikey, username);
    cartoDBStorage.imports(function(imports) {
      loadImports(imports);
    });
  }, function() {
    cartoDBAPI = new CartoDBAPI();
    loadApikeyAndUsername('', '');
    toggleInstructions(true);
  });
}

function saveClicked() {
  var apikey_field = document.getElementById('apikey');
  var username_field = document.getElementById('username');

  var error = document.getElementById('required-data-error'); 
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
  toggleInstructions(hasCredentials);
}

function save(apikey, username, callback) {
  cartoDBStorage.setCredentials(apikey, username, function() {
    cartoDBAPI = new CartoDBAPI(apikey, username);
    callback();
  });
}

function dismissedClicked() {
  save('', '', function() { window.close(); });
}

function loadApikeyAndUsername(apikeyValue, usernameValue) {
  var apikey = document.getElementById('apikey');
  var username = document.getElementById('username');

  apikey.value = apikeyValue || '';
  username.value = usernameValue || '';
}

function loadImports(imports) {
  var importList = document.getElementById('tableImportList');
  while(importList.hasChildNodes()) {
    importList.removeChild(importList.firstChild);
  }

  imports = imports.sort(function(a, b) {
    return a.timestamp - b.timestamp;
  }).slice(0, 10);

  for(var i in imports) {
    var tableImport = imports[i];
    var stateId = 'state-' + tableImport.item_queue_id;
    importList.appendChild(createElement('li', tableImport.filename + '. <a class="state" id="' + stateId + '"></a>'));
    loadState(tableImport, document.getElementById(stateId));
  }

  if(imports.length === 0) {
    importList.appendChild(createLi('No imports yet, let\'s begin!'));
  }

  document.getElementById('imports').style.display = 'block';
}

function loadState(tableImport, stateLink) {
  if(tableImport.state === 'completed') {
      stateLink.innerText = tableImport.state;
  } else {
    stateLink.innerText = 'Loading...';
      
    cartoDBAPI.loadState(tableImport, function(stateResult) {
      var state = stateResult.state;
      stateLink.innerText = state;
    });
  }
}

function createElement(tagName, html) {
  var li = document.createElement(tagName);
  li.innerHTML = html;
  return li;
}

function toggleInstructions(show) {
  if(show) {
    document.getElementById('instructions').style.display = 'block';
  } else {
    document.getElementById('instructions').style.display = 'none';
  }
}
