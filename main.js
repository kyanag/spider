const App = require("./src/App.js");

let config = require("./sites/jiandan.js");

let app = new App(config);
app.run();