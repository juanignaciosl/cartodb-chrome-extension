function saveClicked() {
  var apikey = document.getElementById('apikey');
  var username = document.getElementById('username');

  if(apikey.value.length > 0 && username.value.length > 0) {
    chrome.storage.sync.set({'apikey': apikey.value, 'username': username.value }, function() {
      window.close();
    });
  } else {
    alert('You must set the username and api key');
  }
}

document.addEventListener(
    'DOMContentLoaded', 
    function () {
      document.getElementById("save-button").addEventListener('click', saveClicked);
      document.getElementById('menu-image').src = chrome.extension.getURL("menu.png");
      document.getElementById('logo-image').src = chrome.extension.getURL("cartodb.png");

      chrome.storage.sync.get(['apikey', 'username'], function(value) {
        var apikey = document.getElementById('apikey');
        var username = document.getElementById('username');

        apikey.value = value.apikey;
        username.value = value.username;
      });
    });

window.addEventListener('click',function(e){
    if(e.target.href!==undefined) {
      chrome.tabs.create({url:e.target.href})
    }
});

