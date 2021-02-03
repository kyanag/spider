const { link_extrator_factory,  xpath_extractor_factory } = require("../src/Extractors.js");
const url = require("url");
const fs = require("fs");
const path = require("path");

let _ = {};

let config = {
    id: "jiandan",
    entry: [
        "http://jandan.net/",
    ],
    workdir: path.resolve("./storage/", "jiandan"),
    max_retry_num: 5,
    listeners:{
        "app.before-start": function(app){
            if(!fs.existsSync("./storage/jiandan")){
                fs.mkdirSync("./storage/jiandan");
            }
            if(!fs.existsSync("./storage/jiandan/images")){
                fs.mkdirSync("./storage/jiandan/images");
            }
        },
        "app.before-stop": function(app){
            
        },
        "app.error": function(app, error){
            
        },
        "request.start": function(request){
            //console.log(`--- ${request.url} 开始`);
        },
        "request.success": function({request, response}, error){
            //console.log(response.body);
        },
        "request.error": function({request}, error){
            //console.log(`\t${request.url} 失败`);
        },
        "extract.success": function(topic, data, {request, response}, resource, app){
            if(topic == "link"){
                return;
            }
            //console.log(`--- ${request.url} 结果`);
            if(topic == "ooxx"){
                let images = data['images'];
                images.forEach( image => {
                    image = url.resolve(request.url, image);

                    app.addResource(image, "download", {
                        '_filename': path.resolve("./storage/jiandan/images", path.basename(image)),
                    });
                });
            }else if(topic == "download"){
                console.log("downloaded:", data);
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
    requestDelay: 1 * 1000,             //请求间隔时间
    finishDelay: 10 * 1000,             //队列空置 ${x} 微秒后退出
};

module.exports = config;