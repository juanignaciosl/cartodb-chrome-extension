var cartoDB;

document.addEventListener(
    'DOMContentLoaded', 
    function () {
      document.getElementById("save-button").addEventListener('click', saveClicked);
      document.getElementById("dismiss-button").addEventListener('click', dismissedClicked);
      document.getElementById('menu-image').src = chrome.extension.getURL("menu.png");
      document.getElementById('logo-image').src = chrome.extension.getURL("cartodb.png");

      chrome.storage.sync.get(['apikey', 'username', 'imports'], function(value) {
        if(value.apikey != '') {
          cartoDB = new CartoDB(value.apikey, value.username);
          loadApikeyAndUsername(value.apikey, value.username);
          loadImports(value.imports);
          updateInterfaceState();
        }
      });
    });

window.addEventListener('click',function(e){
    if(e.target.href!==undefined) {
      chrome.tabs.create({url:e.target.href})
    }
});

function saveClicked() {
  var apikey_field = document.getElementById('apikey');
  var username_field = document.getElementById('username');

  var error = document.getElementById('required-data-error'); 
  var apikey = apikey_field.value.trim();
  var username = username_field.value.trim();
  if(apikey.length > 0 && username.length > 0) {
    save(apikey, username, function() { window.close(); });
    error.style.display = 'none';
  } else {
    error.style.display = 'block';
  }
  updateInterfaceState();
}

function hideInstructions() {
  document.getElementById('instructions').style.display = 'none';
}

function displayInstructions() {
  document.getElementById('instructions').style.display = 'block';
}

function dismissedClicked() {
  save('', '', function() { window.close(); });
}

function save(apikey, username, callback) {
  chrome.storage.sync.set({'apikey': apikey, 'username': username }, callback);
  cartoDB = new CartoDB(value.apikey, value.username);
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
      
    cartoDB.loadState(tableImport, function(stateResult) {
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

function updateInterfaceState() {
  var apikey = document.getElementById('apikey');
  if(apikey.value === '') {
    displayInstructions();
  } else {
    hideInstructions();
  }
}
