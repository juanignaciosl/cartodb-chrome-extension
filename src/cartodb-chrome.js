////////////// Helper methods to handle histogram sparse arrays
Array.prototype.sparseLength = function() {
  var c = 0;
  for(a in this) {
    if(!isNaN(a)) {
      c++;
    }
  }
  return c;
}

Array.prototype.sparseFirst = function() {
  var first = this;
  for(a in this) {
    if(!isNaN(a)) {
      first = a;
      break;
    }
  }
  return first;
}

////////////// Display button methods
function makeTablesImportables() {
	var tables = importableTables();
	for(var t = 0; t < tables.length; t++) {
    addImportButton(tables[t]);
  }
}

function importableTables() {
  // TODO: improve filtering, do something clever here ;)
  var tables =  [].slice.call(document.getElementsByTagName('table'));
  tables = filterTablesWithInnerTables(tables);
  tables = filterSmallTables(tables);
  return tables;
}

function filterTablesWithInnerTables(sourceTables) {
  var tables = [];
  for(var rt = 0; rt < sourceTables.length; rt++) {
    var table = sourceTables[rt];
    if(table.innerHTML.indexOf('<table') == -1) {
      tables.push(table);
    }
  }
  return tables;
}

function filterSmallTables(tables) {
  return tables.filter(function(table) {
    return (table.rows.length > 2) && (table.rows[table.rows.length - 1].cells.length > 1);
  });
}

function addImportButton(table) {
  var imgURL = chrome.extension.getURL("cartodb.png");

  var button = document.createElement('div');
  button.className = 'cartodb-import-button';
  button.onclick = importTableFromButton;
  button.title = 'Click to import to CartoDB';
  button.style.backgroundImage = "url('"+imgURL+"')";

  table.parentNode.insertBefore(button, table);
}

/////////////// Importing
function importTableFromButton(event) {
  importTable(event.srcElement.nextSibling);
}

function importTable(table) {
  var csv = toCsv(table);
  sendCsv(csv);
}

function toCsv(table) {
  var rowArray = [];
  var rows = importableRows(table);
  for(var r = 0; r < rows.length; r++) {
    var cells = rows[r];
    var cellArray = [];
    for(var c = 0; c < cells.length; c++) {
      var cell = cells[c];
      cellArray.push(cleanText(cell.innerText));
    }
    rowArray.push(cellArray.join(','));
  }
  return rowArray.join('\n');
}

function cleanText(innerText) {
  var tmp = document.createElement("DIV");
  tmp.innerHTML = innerText;
  var cleanedText = tmp.textContent || tmp.innerText || "";
  // TODO: better way to remove commas? Maybe other separator?
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
  var importableRows = filterArrayPerElements(rows, maxCols);
  return importableRows;
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
  if(interestingIndexes[0] > 0) {
    var distances = valueDistances(interestingIndexes);
    var distancesHistogram = valueHistogram(distances);
    if(distancesHistogram.sparseLength() === 1) {
      var distance = distancesHistogram.sparseFirst();
      var collapsedRows = [];
      for(var ii = 0; ii < interestingIndexes.length; ii++) {
        var collapsedRow = [];
        var interestingIndex = interestingIndexes[ii];
        for(var c = interestingIndex - distance + 1; c <= interestingIndex; c++) {
          Array.prototype.push.apply(collapsedRow, rows[c]);
        }
        collapsedRows.push(collapsedRow);
      }
      rows = collapsedRows;
    }
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
    /*
    var postUrl = 'http://development.localhost.lan:3000';

    var xhr = new XMLHttpRequest();
    xhr.open('POST', postUrl, true);

    var params = 'csv=' + csv;

    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    xhr.onreadystatechange = function() { 
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
        } else {
        }
      }
    };

    // Send the request and set status
    xhr.send(params);
    */
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

makeTablesImportables();
