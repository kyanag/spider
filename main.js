var arguments = process.argv.splice(2);

const {App} = require("./build/src/lib/App");

let config = require(`./build/sites/${arguments[0]}.js`);

let app = new App(config);
//console.log(App);
app.run();