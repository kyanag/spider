var arguments = process.argv.splice(2);
const { Factory } = require("./build/src/lib/Factory");

let config = require(`./build/sites/${arguments[0]}.js`);
let app = Factory.simple(config);
app.run();