function DomainBlacklist(domains) {
  this.contains = function(currentDomain) {
    var allSubdomains = [ currentDomain ];
    var parts = currentDomain.split('.');
    for(var i = 1; i < parts.length; i++) {
      allSubdomains.push(parts.slice(i, parts.length).join('.'));
    }
    for(var s = 0; s < allSubdomains.length; s++) {
      var subdomain = allSubdomains[s];
      if(domains.indexOf(subdomain) != -1) {
        return true;
      }
    }
    return false;
  }
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
