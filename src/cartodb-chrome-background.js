var SEND_CSV_OK = "Table sent! You can see the status by clicking the top CartoDB icon at the browser bar.";
var SEND_CSV_TITLE = 'Table successfully sent';
var SEND_CSV_MESSAGE = SEND_CSV_OK;

var SEND_CSV_ERROR_TITLE = 'Error sending table';
var SEND_CSV_ERROR_MESSAGE = "Couldn't contact import service. Server is down or connection is flacky, please retry later.";

var SAVE_USER_OK_TITLE = 'User credentials saved';
var SAVE_USER_OK_MESSAGE = "Your username and apikey were successfully saved, let's import some tables!";

chrome.runtime.onInstalled.addListener(function() {
  var context = "all";
  var title = "Import table in CartoDB";
  var id = chrome.contextMenus.create({
      "title": title, 
      "contexts":[context],
      "id": "context" + context
  });  
});

chrome.contextMenus.onClicked.addListener(onClickHandler);

// The onClicked callback function.
function onClickHandler(info, tab) {
  chrome.tabs.sendMessage(tab.id, "getClickedEl");
};

function createNotification(id, title, message) {
  chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: 'cartodb.png',
    title: title,
    message: message
  }, function(id) {
    console.log("Last error:", chrome.runtime.lastError);
  });
}

chrome.runtime.onMessage.addListener(function(msg, sender) {
  if(msg.type === 'SEND_CSV_OK') {
    createNotification('import-notification', SEND_CSV_TITLE, SEND_CSV_MESSAGE);
  } else if(msg.type === 'SEND_CSV_ERROR') {
    createNotification('import-notification', SEND_CSV_ERROR_TITLE, SEND_CSV_ERROR_MESSAGE);
  } else if(msg.type === 'SAVE_USER_OK') {
    createNotification('user-save', SAVE_USER_OK_TITLE, SAVE_USER_OK_MESSAGE);
  }
});
