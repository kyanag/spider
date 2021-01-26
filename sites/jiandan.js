const { link_extrator_factory, query_extractor_factory, xpath_extractor_factory } = require("../src/Extractors.js");

let _ = {};

let config = {
    entry: [
        "",
    ],
    maxRetryNum: 5,
    listeners:{
        "app.before-start": function(app){

        },
        "app.before-stop": function(app){
            
        },
        "app.error": function(app, error){
            
        },
        "request.start": function(request){
            //console.log(`--- ${request.url} 开始`);
        },
        "request.finish": function(request, response, error){
            //console.log(`\t${request.url} 成功`);
        },
        "request.error": function(request, error){
            //console.log(`\t${request.url} 失败`);
        },
        "extract.success": function(topic, data, {request, response}, app){
            console.log(`--- ${request.url} 结果`);
            console.log(topic, data);
        },
        "extract.error": function(error){
            console.log(error);
        },
        "resource.push": function(request){
            _[request.url] = true;
            //console.log(`入队: ${request.url}`);
        }
    },
    routes: [
        {
            topic: "@link",
            regex: "",
            extractor: link_extrator_factory({
                patterns: [
                    "article-2903"
                ]
            }),
        },
        {
            topic: "article",
            regex: /article\-(\d*).*\.html/g,
            extractor: xpath_extractor_factory({
                'title': "/html/head/title/text()",
                //'images': "/html/body/div[5]/a/img/@src"
            }),
        },
        {
            topic: "download_file",
            regex: null,
            extractor: function(app, {request, response}, resource){
                
            },
        },
    ],
    requestDelay: 1 * 1000,             //请求间隔时间
    finishDelay: 10 * 1000,             //队列空置 ${x} 微秒后退出
};

module.exports = config;