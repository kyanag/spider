var arguments = process.argv.splice(2);
const { App } = require("./build/src/lib/App");
const { Factory } = require("./build/src/lib/Factory");

let config = require(`./build/sites/${arguments[0]}.js`);


let app = Factory.createApp(config);
app.run();