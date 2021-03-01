const { link_extrator_factory,  xpath_extractor_factory } = require("../src/Extractors.js");
const url = require("url");
const fs = require("fs");
const path = require("path");

let _ = {};

let config = {
    id: "jiandan",
    entry: [
        "http://jandan.net/",
        "http://jandan.net/abc",
        "httpa://jandan.net/abc"
    ],
    max_retry_num: 5,
    listeners:{
        // ["resource.push"] : Function,           //resource 入队
        // ["resource.shift"] : Function,          //resource 出队 - 超过最大次数或者被主动抛弃
        // ["resource.ready"] : Function,          //resource 发出请求之前
        // ["resource.responded"]: Function,        //resource.request 返回结果
        // ["resource.success"] : Function,        //resource request成功，且状态码为20x
        // ["resource.warning"] : Function,        //resource http请求成功，但是状态码不对
        // ["resource.fail"] : Function,           //resource 请求失败

        // ["extract.success"] : Function,          //抽取器 抽取数据成功
        // ["extract.fail"] : Function,             //抽取器 抽取失败
        "app.before-start": function(){
            if(!fs.existsSync("./storage/jiandan")){
                fs.mkdirSync("./storage/jiandan");
            }
            if(!fs.existsSync("./storage/jiandan/images")){
                fs.mkdirSync("./storage/jiandan/images");
            }
        },
        "app.ready": function(){
            
        },
        "app.before-stop": function(){
            
        },
        "app.error": function(error){
            console.log(`app-error: ${JSON.stringify(error)}`);
        },
        "resource.push": function(resource){
            console.log(`入队: ${resource.request.url}`);
        },
        "resource.ready": function(resource){
            //console.log(`--- ${request.url} 开始`);
        },
        "resource.shift": function(resource){
            //console.log(`--- ${request.url} 开始`);
        },
        "resource.responded": function(resource){
            //console.log(resource.response.body);
        },
        "resource.success": function(resource){
            console.log(`success: ${resource.request.url}`);
        },
        "resource.warning": function(resource){
            console.log(`warning: ${resource.request.url}`);
        },
        "resource.fail": function(resource, error){
            console.log(`fail: ${resource.request.url}`);
        },
        "extract.success": function(data, handler, resource){
            if(topic == "link"){
                return;
            }
            //console.log(`--- ${request.url} 结果`);
            if(topic == "ooxx"){
                let images = data['images'];
                images.forEach( image => {
                    image = url.resolve(request.url, image);

                    this.addResource(image, "download", {
                        '_filename': path.resolve("./storage/jiandan/images", path.basename(image)),
                    });
                });
            }else if(topic == "download"){
                console.log("downloaded:", data);
            }
            //console.log(topic, data);
        },
        "extract.fail": function(route, resource){
            console.log(error);
        },
    },
    routes: [
        {
            topic: "link",
            regex: "",
            extractor: link_extrator_factory({
                patterns: [
                    /\/ooxx[\/a-zA-Z0-9]*/g,
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
                'images': [`//*[contains(@id,'comment-')]/div/div/div[2]/p/a/@href`, true],
                //'images': "/html/body/div[5]/a/img/@src"
            }),
        },
        {
            topic: "download",
            regex: null,
            /**
             * 
             * @param {Request, Response} param0 
             * @param {Array} resource 
             */
            extractor: function({request, response}, resource){
                let save_as = resource._extra_attributes['_filename'];
                //console.log(response.headers['content-type']);
                fs.writeFileSync(save_as, response.body);
                return {
                    save_as
                };
            },
        },
    ],
    interval: 1 * 1000,             //请求间隔时间
    timeout: 10 * 1000,             //队列空置 ${x} 微秒后退出
};

module.exports = config;