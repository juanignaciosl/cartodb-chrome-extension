function saveClicked() {
  var apikey = document.getElementById('apikey');
  if(apikey.value.length > 0) {
    chrome.storage.sync.set({'apikey': apikey.value }, function() {
      window.close();
    });
  } else {
    alert('You must set the api key');
  }
}

document.addEventListener(
    'DOMContentLoaded', 
    function () {
      document.getElementById("save-button").addEventListener('click', saveClicked);
      document.getElementById('menu-image').src = chrome.extension.getURL("menu.png");
      document.getElementById('logo-image').src = chrome.extension.getURL("cartodb.png");
    });

window.addEventListener('click',function(e){
    if(e.target.href!==undefined) {
      chrome.tabs.create({url:e.target.href})
    }
});

