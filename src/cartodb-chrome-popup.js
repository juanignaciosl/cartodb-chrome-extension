function saveClicked() {
  var apikey = document.getElementById('apikey').value;
  chrome.storage.sync.set({'apikey': apikey }, null);
}

document.addEventListener(
    'DOMContentLoaded', 
    function () {
      document.getElementById("save-button").addEventListener('click', saveClicked);
    });
