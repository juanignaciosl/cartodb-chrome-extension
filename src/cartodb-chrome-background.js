var SEND_CSV_OK = "Table sent! You can see the status by clicking the top CartoDB icon at the browser bar.";
var SEND_CSV_NOTIFICATION_TITLE = 'Table successfully sent';
var SEND_CSV_NOTIFICATION_MESSAGE = SEND_CSV_OK;

var SEND_CSV_ERROR_NOTIFICATION_TITLE = 'Error sending table';
var SEND_CSV_ERROR_NOTIFICATION_MESSAGE = "Couldn't contact import service. Server is down or connection is flacky, please retry later.";

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

chrome.runtime.onMessage.addListener(function(msg, sender) {
  if(msg.type === 'SEND_CSV_OK') {
    chrome.notifications.create('import-notification', {
      type: 'basic',
      iconUrl: 'cartodb.png',
      title: SEND_CSV_NOTIFICATION_TITLE,
      message: SEND_CSV_NOTIFICATION_MESSAGE
    }, function(id) {
      console.log("Last error:", chrome.runtime.lastError);
    });
  } else if(msg.type === 'SEND_CSV_ERROR') {
    chrome.notifications.create('import-notification', {
      type: 'basic',
      iconUrl: 'cartodb.png',
      title: SEND_CSV_ERROR_NOTIFICATION_TITLE,
      message: SEND_CSV_ERROR_NOTIFICATION_MESSAGE
    }, function(id) {
      console.log("Last error:", chrome.runtime.lastError);
    });
  }
});
