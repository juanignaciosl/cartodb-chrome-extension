chrome.runtime.onInstalled.addListener(function() {
  var context = "all";
  var title = "Import in CartoDB";
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
