const Rx = require("rxjs");
const a = require("rxjs/ajax")
const { map, filter, concatMap} = require("rxjs/operators");

const { link_extrator } = require("./src/Extractors")

const App = require("./src/App.js");

let config = {
    "entry": [
        "https://www.npmjs.com/",
        "https://www.npmjs.com/package/cheerio",
    ],
    "maxRetryNum": 5,
    "domains": [
        'www.npmjs.com'
    ],
    "extractors": {
        'links': link_extrator,
    },
    "routes": [
        {
            topic: "@links",
            regex: "",
            extractor: "links",
        },
        {
            topic: "projects",
            regex: /\/package\/\w+/g,
            extractor: "links",
        },
    ],
    requestDelay: 0 * 1000,             //请求间隔时间
    sleepDelay: 5 * 1000,               //请求队列空后， 睡眠时间
    finishDelay: 10 * 1000,             //队列空置 ${x} 微秒后退出
};

let app = new App(config);
app.run();