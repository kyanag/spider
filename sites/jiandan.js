const { link_extrator_factory,  xpath_extractor_factory } = require("../src/Extractors.js");

let _ = {};

let config = {
    entry: [
        "http://jandan.net/",
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
        "request.success": function(request, response, error){
            //console.log(response.body);
        },
        "request.error": function(request, error){
            //console.log(`\t${request.url} 失败`);
        },
        "extract.success": function(topic, data, {request, response}, app){
            if(topic == "link"){
                return;
            }
            console.log(`--- ${request.url} 结果`);
            if(topic == "ooxx"){
                console.log(topic, data);
            }
            //console.log(topic, data);
        },
        "extract.error": function(error){
            console.log(error);
        },
        "resource.push": function(resource){
            //_[resource.request.url] = true;
            //console.log(`入队: ${resource.request.url}`);
        }
    },
    routes: [
        {
            topic: "link",
            regex: "",
            extractor: link_extrator_factory({
                patterns: [
                    /ooxx[\/a-zA-Z0-9]*/g,
                    // /p\/(\d*)$/g,
                    // /page\/(\d*)/g,
                ]
            }).addDecorator(function(links){
                links.forEach( link => {
                    if(_[link] !== true){
                        _[link] = true;
                        this.addResource(link);
                    }
                })
                return links;
            }),
        },
        {
            topic: "ooxx",  //随手拍
            regex: /ooxx[\/a-zA-Z0-9]*/g,
            extractor: xpath_extractor_factory({
                'img_src': `//*[contains(@id,'comment-')]/div/div/div[2]/p/a`,
                //'images': "/html/body/div[5]/a/img/@src"
            }),
        },
        {
            topic: "article",
            regex: /p\/(\d*)/g,
            extractor: xpath_extractor_factory({
                'title': `//*[@id="content"]/div[2]/h1/a`,
                'time': `//*[@id="content"]/div[2]/div[1]/text()`,
                //'images': "/html/body/div[5]/a/img/@src"
            }),
        },
        {
            topic: "download_file",
            regex: null,
            extractor: function({request, response}, resource){
                
            },
        },
    ],
    requestDelay: 1 * 1000,             //请求间隔时间
    finishDelay: 10 * 1000,             //队列空置 ${x} 微秒后退出
};

module.exports = config;