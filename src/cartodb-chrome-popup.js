var cartoDB = new CartoDB(new CartoDBAPI(), new CartoDBLocalStorage());

var TABLE_LINK = 'view';

document.addEventListener(
    'DOMContentLoaded', 
    function () {
      document.getElementById('username').focus();
      document.getElementById("save-button").addEventListener('click', saveClicked);
      document.getElementById("dismiss-button").addEventListener('click', dismissedClicked);
      document.getElementById('logo-image').src = chrome.extension.getURL("avatar_200x200.png");
      document.getElementById('profile-image').src = chrome.extension.getURL("avatar_100x100.png");

      loadInitialData();
    });

window.addEventListener('click',function(e){
    if(e.target.href!==undefined) {
      chrome.tabs.create({url:e.target.href})
    }
});

function loadInitialData() {
  cartoDB.credentials(function(apikey, username) {
    loadApikeyAndUsername(apikey, username);
    cartoDB.imports(function(imports) {
      loadImports(imports);
      toggleLoggedIn(true);
    });
  }, function() {
    loadApikeyAndUsername('', '');
    toggleLoggedIn(false);
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
      chrome.runtime.sendMessage({type: 'SAVE_USER_OK'});
      window.close()
    });
  } else {
    error.style.display = 'block';
  }
  toggleLoggedIn(hasCredentials);
}

function save(apikey, username, callback) {
  cartoDB.setCredentials(apikey, username, callback);
}

function dismissedClicked() {
  save('', '', function() { window.close(); });
}

function loadApikeyAndUsername(apikeyValue, usernameValue) {
  var apikey = document.getElementById('apikey');
  var username = document.getElementById('username');
  var logged_in_username = document.getElementById('logged-in-username');

  apikey.value = apikeyValue || '';
  username.value = usernameValue || '';
  logged_in_username.innerText = usernameValue || '';
}

function loadImports(imports) {
  var importList = document.getElementById('tableImportList');
  while(importList.hasChildNodes()) {
    importList.removeChild(importList.firstChild);
  }

  imports = imports.sort(function(a, b) {
    return a.timestamp - b.timestamp;
  }).reverse().slice(0, 10);

  for(var i in imports) {
    var tableImport = imports[i];
    var stateId = 'state-' + tableImport.item_queue_id;
    var li = createElement('li', tableImport.filename);
    importList.appendChild(li);
    loadState(tableImport, li);
  }

  if(imports.length === 0) {
    importList.appendChild(createElement('li', 'No imports yet, let\'s begin!'));
  }

  document.getElementById('imports').style.display = 'block';
}

function loadState(tableImport, importElement) {
  var stateLink = createElement('span');
  stateLink.className = 'state';
  importElement.appendChild(stateLink);
  stateLink.innerText = 'Loading...';

  cartoDB.tableImportResult(tableImport, function(tableImportResult) {
    if(tableImportResult != null) {
      stateLink.innerText = tableImportResult.state;

      if(tableImportResult.state === 'complete') {
        cartoDB.tableURL(tableImportResult, function(url) {
          stateLink.innerText = 'Done!'
          // TODO: commented out until we can provide a valid link
          //importElement.removeChild(stateLink);
          //stateLink = createElement('a');
          //stateLink.className = 'state';
          //stateLink.innerText = TABLE_LINK;
          //stateLink.href = url;
          //importElement.appendChild(stateLink);
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

function toggleLoggedIn(isLoggedIn) {
  var body = document.getElementsByTagName('body')[0];
  body.className = isLoggedIn ? 'logged-in' : 'not-logged-in';
}
