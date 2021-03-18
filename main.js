const App = require("./build/src/lib/App");
const jsdom = require("jsdom");

let config = require("./build/sites/jiandan.js");

let app = new App(config);
app.run();