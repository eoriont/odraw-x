function getUrlVars() {
  var vars = [], hash;
  var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
  for(var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split('=');
    vars.push(hash[0]);
    vars[hash[0]] = hash[1];
  }
  return vars;
}

var config = {
  apiKey: "AIzaSyCb9Nxkj52W_mNVnZKY_18QlGerxbs0Ogc",
  authDomain: "odraw-x.firebaseapp.com",
  databaseURL: "https://odraw-x.firebaseio.com",
  projectId: "odraw-x",
  storageBucket: "odraw-x.appspot.com",
  messagingSenderId: "885108201960"
};
firebase.initializeApp(config);
var database = firebase.database();
var dblink = 'drawing/'+getUrlVars()["id"];
var drawingRef = firebase.database().ref(dblink);