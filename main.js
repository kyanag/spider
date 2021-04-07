const {App} = require("./build/src/lib/App");

let config = require("./build/sites/jiandan.js");

let app = new App(config);
//console.log(App);
app.run();