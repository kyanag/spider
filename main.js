const { linkExtrator } = require("./src/Extractors")

const App = require("./src/App.js");
const cheerio = require("cheerio");

let config = {
    entry: [
        "https://www.npmjs.com/",
        "https://www.npmjs.com/package/cheerio",
    ],
    maxRetryNum: 5,
    domains: [
        'www.npmjs.com'
    ],
    listeners:{
        "request.start": function(request){
            console.log(`--- ${request.url} 开始`);
        },
        "request.finish": function(request, response, error){
            console.log(`\t${request.url} 成功`);
        },
        "request.error": function(request, error){
            console.log(`\t${request.url} 失败`);
        },
        "extract.success": function(topic, data, {request, response}){
            console.log(topic, data);
        },
        "extract.error": function(error){
            console.log(error);
        },
        "resource.push": function(request){
            console.log(`入队: ${request.url}`);
        }
    },
    extractors: {
        'links': linkExtrator,
    },
    routes: [
        {
            topic: "@link",
            regex: "",
            extractor: "links",
        },
        {
            topic: "projects",
            regex: /\/package\/\w+/g,
            extractor: function(app, {request, response}){
                let $ = cheerio.load(response.body);
                return {
                    title: $("title").html(),
                    url: request.url
                };
            },
        },
    ],
    requestDelay: 0 * 1000,             //请求间隔时间
    finishDelay: 10 * 1000,             //队列空置 ${x} 微秒后退出
};

let app = new App(config);
app.run();