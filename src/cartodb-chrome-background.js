var SEND_OK = "Dataset sent! You can see the status by clicking the top CartoDB icon at the browser bar.";
var SEND_TITLE = 'Dataset successfully sent';
var SEND_MESSAGE = SEND_OK;

var SEND_ERROR_TITLE = 'Error sending dataset';
var SEND_ERROR_MESSAGE = "Couldn't contact import service. Server is down or connection is flacky, please retry later.";

var SAVE_USER_OK_TITLE = 'User credentials saved';
var SAVE_USER_OK_MESSAGE = "Your username and apikey were successfully saved, let's import some datasets!";

chrome.runtime.onInstalled.addListener(function() {
  var context = "all";
  var title = "Import dataset in CartoDB";
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
  if(msg.type === 'SEND_OK') {
    createNotification('import-notification', SEND_TITLE, SEND_MESSAGE);
  } else if(msg.type === 'SEND_ERROR') {
    createNotification('import-notification', SEND_ERROR_TITLE, SEND_ERROR_MESSAGE);
  } else if(msg.type === 'SAVE_USER_OK') {
    createNotification('user-save', SAVE_USER_OK_TITLE, SAVE_USER_OK_MESSAGE);
  }
});
