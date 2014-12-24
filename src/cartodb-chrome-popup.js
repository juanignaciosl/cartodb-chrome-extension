function saveClicked() {
  var apikey_field = document.getElementById('apikey');
  var username_field = document.getElementById('username');

  var error = document.getElementById('required-data-error'); 
  var apikey = apikey_field.value.trim();
  var username = username_field.value.trim();
  if(apikey.length > 0 && username.length > 0) {
    error.style.display = 'none';
    save(apikey, username, function() { window.close(); });
  } else {
    error.style.display = 'block';
  }
}

function dismissedClicked() {
  save('', '', function() { window.close(); });
}

function save(apikey, username, callback) {
  chrome.storage.sync.set({'apikey': apikey, 'username': username }, callback);
}


document.addEventListener(
    'DOMContentLoaded', 
    function () {
      document.getElementById("save-button").addEventListener('click', saveClicked);
      document.getElementById("dismiss-button").addEventListener('click', dismissedClicked);
      document.getElementById('menu-image').src = chrome.extension.getURL("menu.png");
      document.getElementById('logo-image').src = chrome.extension.getURL("cartodb.png");

      chrome.storage.sync.get(['apikey', 'username'], function(value) {
        var apikey = document.getElementById('apikey');
        var username = document.getElementById('username');

        apikey.value = value.apikey || '';
        username.value = value.username || '';
      });
    });

window.addEventListener('click',function(e){
    if(e.target.href!==undefined) {
      chrome.tabs.create({url:e.target.href})
    }
});

