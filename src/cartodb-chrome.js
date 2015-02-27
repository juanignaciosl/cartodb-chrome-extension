var cartoDB = new CartoDB(new CartoDBAPI(), new CartoDBLocalStorage());

var ICON_URL = chrome.extension.getURL("cartodb-stroke.png");

var MIN_ROWS = 4
var MIN_COLS = 2

////////////// Strings
var BUTTON_TITLE = 'Click to import to CartoDB';

////////////// Display button methods at tables
function makeTablesImportables() {
	var tables = importableTables();
  tables.map(function(table) {
    addImportButton(table, tableImportButton(importTableFromButton));
  });
}

function importButton(onclickHandler) {
  var button = document.createElement('div');
  button.className = 'cartodb-import-button';
  button.onclick = onclickHandler;
  button.title = BUTTON_TITLE;
  return button;
}

function tableImportButton(onclickHandler) {
  var button = importButton(onclickHandler);
  button.className += ' table-import';
  return button;
}

function importTableFromButton(event) {
  importTable(event.srcElement.nextSibling);
}

function importableTables() {
  var tables =  [].slice.call(document.getElementsByTagName('table'));
  tables = filterTablesWithInnerTables(tables);
  tables = filterSmallTables(tables);
  return tables;
}

function filterTablesWithInnerTables(sourceTables) {
  return sourceTables.filter(function(table) {
    return table.innerHTML.indexOf('<table') == -1;
  });
}

function filterSmallTables(tables) {
  return tables.filter(function(table) {
    var rows = table.rows;
    return (rows.length >= MIN_ROWS) 
        && (rows[rows.length - 1].cells.length >= MIN_COLS);
  });
}

////////////// Display button methods at links
function makeLinksImportables() {
	var links = importableLinks();
  links.map(function(link) {
    addImportButton(link, linkImportButton(importLinkFromButton));
  });
}

function linkImportButton(onclickHandler) {
  var button = importButton(onclickHandler);
  button.className += ' link-import';
  return button;
}

function importLinkFromButton(event) {
  importLink(event.srcElement.nextSibling);
}

function addImportButton(element, button) {
  var style = button.style;
  style.backgroundImage = "url('"+ICON_URL+"')";
  style.opacity = 0;

  element.parentNode.insertBefore(button, element);

  style.top = (button.offsetTop - 20) + 'px';
  style.left = (button.offsetLeft - 20) + 'px';
  style.opacity = null;
}

function importableLinks() {
  var links =  [].slice.call(document.getElementsByTagName('a'));
  links = filterLinksWithKnownExtensions(links);
  return links;
}

function filterLinksWithKnownExtensions(sourceLinks) {
  return sourceLinks.filter(function(link) {
    return link.href.slice(-3) === 'csv';
  });
}

/////////////// Importing
function importTable(table) {
  sendCsv(toCsv(table));
}

function importLink(link) {
  sendFileUrl(link.href);
}

function toCsv(table) {
  var commaSeparatedCellRows = [];
  var rows = importableRows(table);
  for(var r = 0; r < rows.length; r++) {
    var cellCollection = rows[r];
    var cellArray = [];
    for(var c = 0; c < cellCollection.length; c++) {
      var cell = cellCollection[c];
      cellArray.push(cleanText(cell.innerText));
    }
    commaSeparatedCellRows.push(cellArray.join(','));
  }
  return commaSeparatedCellRows.join('\n');
}

function cleanText(innerText) {
  var tmp = document.createElement("DIV");
  tmp.innerHTML = innerText;
  var cleanedText = tmp.textContent || tmp.innerText || "";
  // TODO: better way to remove decimal commas? Maybe quoting or other separator?
  return cleanedText.replace('\n', ' ').replace('<br>', ' ').replace('<br />', ' ').replace(',', '.').trim();
}

function importableRows(table) {
  var rows = [].slice.call(table.rows).map(function(row) {
    return row.cells;
  });
  rows = filterRowsWithRowspanCells(rows);
  var collapsedRows = 0;
  var maxCols = 0;
  while(rows.length != collapsedRows) {
    collapsedRows = rows.length;
    var colsHistogram = lengthHistogram(rows);
    // INFO: we don't mind rows with 0 or 1 columns
    colsHistogram[0] = 0;
    colsHistogram[1] = 1;
    maxCols = indexOfMax(colsHistogram);
    rows = collapseHeaderRows(rows, maxCols);
  }
  return filterArrayPerElements(rows, maxCols);
}

function filterRowsWithRowspanCells(rows) {
  return rows.filter(function(cells) {
    var hasRowspan = false;
    for(var c = 0; c < cells.length; c++) {
      var cell = cells[c];
      if(cell.rowSpan != 1) {
        hasRowspan = true;
        break;
      }
    }
    return !hasRowspan;
  });
}

function lengthHistogram(arrays) {
  return valueHistogram(arrays.map(function(array) {
    return array.length;
  }));
}

function valueHistogram(values) {
  var histogram = [];
  for(var v = 0; v < values.length; v++) {
    var value = values[v];
    if(typeof histogram[value] === 'undefined') {
      histogram[value] = 0;
    }
    histogram[value]++;
  }
  return histogram;
}

function indexOfMax(array) {
  var max = 0;
  var freq = 0;
  for(var h = 0; h < array.length; h++) {
    if(max < array[h]) {
      max = array[h];
      freq = h;
    }
  }
  return freq;
}

function filterArrayPerElements(arrays, nElements) {
  return arrays.filter(function(array) {
    return array.length === nElements;
  });
}

function collapseHeaderRows(rows, interestingRowLength) {
  var interestingIndexes = [];
  rows.map(function(row, index, array) {
    if(row.length === interestingRowLength) {
      interestingIndexes.push(index);
    }
  });
  var distances = valueDistances(interestingIndexes);
  var distancesHistogram = valueHistogram(distances);
  if(distancesHistogram.sparseLength() === 1) {
    var distance = distancesHistogram.sparseFirst();
    var collapsedRows = [];
    interestingIndexes.map(function(interestingIndex) {
      var collapsedRow = [];
      for(var c = interestingIndex - distance + 1; c <= interestingIndex; c++) {
        Array.prototype.push.apply(collapsedRow, rows[c]);
      }
      collapsedRows.push(collapsedRow);
    });
    rows = collapsedRows;
  }
  return rows;
}

function valueDistances(values) {
  var distances = [ ];
  for(var v = 1; v < values.length; v++) {
    distances.push(values[v] - values[v-1]);
  }
  return distances;
}

function sendCsv(csv) {
  console.log(csv);

  cartoDB.credentials(function(apikey, username) {
    sendCsvWithApikey(csv);
  }, noCredentialsError);
}

function sendFileUrl(url) {
  console.log(url);

  cartoDB.credentials(function(apikey, username) {
    sendFileUrlWithApikey(url);
  }, noCredentialsError);
}

function noCredentialsError() {
  alert('You must click the CartoDB icon at the top bar and set your Api key');
}

function sendCsvWithApikey(csv) {
  var name = filename();

  cartoDB.sendCsv(name, csv, function(importResult) {
    addImport(importResult, name, sendImportOkHandler);
  }, sendImportErrorHandler);
}

function extractNameFromUrl(url) {
  var parts = url.split('/');
  return parts[parts.length - 1];
}

function sendFileUrlWithApikey(url) {
  cartoDB.sendFileUrl(url, function(importResult) {
    addImport(importResult, extractNameFromUrl(url), sendImportOkHandler);
  }, sendImportErrorHandler);
}

function sendImportOkHandler() {
  chrome.runtime.sendMessage({type: 'SEND_OK'});
}

function sendImportErrorHandler() {
  chrome.runtime.sendMessage({type: 'SEND_ERROR'});
}

function addImport(importResult, filename, callback) {
  cartoDB.addImport({ item_queue_id: importResult.item_queue_id, timestamp: new Date().getTime(), filename: filename }, callback);
}

function filename() {
  var d = new Date();
  //return 'import_' + d.getFullYear() + (d.getMonth()+1) + d.getDay() + d.getHours() + d.getMinutes() + d.getMilliseconds() + '.csv';
  return sprintf("import_%4d%02d%02d%02d%02d%03d.csv", d.getFullYear(), d.getMonth()+1, d.getDate(), d.getHours(), d.getMinutes(), d.getMilliseconds());
}

// INFO: for context menu to retrieve clicked element
var clickedEl = null;
var clickedFakeIdCount = 0;
document.addEventListener("mousedown", function(event){
    //right click
    if(event.button == 2) { 
        clickedEl = event.target;
    }
}, true);

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if(request == "getClickedEl" && clickedEl != null) {
      var table = closestTable(clickedEl);
      if(table == null) {
        alert("Click on a table to import data into CartoDB");
      } else {
        importTable(table);
      }
    }
});

function closestTable(element) {
  while(element != null && (typeof element.tagName === 'undefined' || element.tagName != 'TABLE')) {
    element = element.parentNode;
  }
  return element;
}

function currentDomain() {
  return window.location.host.split(':')[0];
}

var blacklistedDomains = new DomainBlacklist(['localhost.lan', 'cartodb.com']);

if(!blacklistedDomains.contains(currentDomain())) {
  makeTablesImportables();
  makeLinksImportables();
}
