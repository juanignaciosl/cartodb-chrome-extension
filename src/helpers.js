function byId(id) {
  return document.getElementById(id);
}

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
