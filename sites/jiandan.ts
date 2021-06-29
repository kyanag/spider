import url from "url";
import fs from "fs-extra";
import path from "path";
import {
    create_resource_from_url,

    create_xpath_extractor,
    create_jsonpath_extractor,
    create_query_extractor,

    extractor_for_link,
    matcher_for_url
} from "../src/lib/functions";

let filter: Set<String> = new Set<String>();

let queue = new Array<Resource>();

let config: Config = {
    id: "jiandan",
    queue: queue,
    max_retry_num: 5,
    interval: 1 * 1000,             //请求间隔时间
    timeout: 10 * 1000,             //队列空置 ${x} 微秒后退出
    listeners: {
        "app.ready": function(app: App){
            if(!fs.existsSync("./storage")){
                fs.mkdirSync("./storage");
            }
            if(!fs.existsSync("./storage/jiandan")){
                fs.mkdirSync("./storage/jiandan");
            }
            if(!fs.existsSync("./storage/jiandan/images")){
                fs.mkdirSync("./storage/jiandan/images");
            }
            if(!fs.existsSync("./storage/jiandan/html")){
                fs.mkdirSync("./storage/jiandan/html");
            }
            if(!fs.existsSync("./storage/jiandan/history.log")){

            }
            queue.push(create_resource_from_url("http://jandan.net/ooxx", []))
        },
        "app.before-stop": function(app: App){
            
        },
        "app.error": function(app: App, error: any){
            console.log(`app-error: ${JSON.stringify(error)}`);
        },
        "resource.push": function(app: App, resource: Resource){
            //console.log(`入队: ${resource.request.url}`);
        },
        "resource.ready": function(app: App, resource:Resource){
            //console.log(`--- ${request.url} 开始`);
        },
        "resource.shift": function(app: App, resource:Resource){
            //console.log(`--- ${request.url} 开始`);
        },
        "resource.responded": function(app: App, resource:Resource, response: IResponse){
            //console.log(resource.response.body);
        },
        "resource.failed": function(app: App, resource:Resource, error: any){
            console.log(`resource.fail: ${resource.request.url}`, error);
        },
        "response.matched": function(app: App, resource:Resource, handler: Handler){
            if(handler.topic == "ooxx"){
                console.warn("matched: ", resource.request.url);
            }
        },
        "extract.success": function(
            app: App, 
            topic: string, 
            data: any, 
            response: IResponse, 
            handler: Handler
        ){
            switch(topic){
                case "link":
                case "ooxx":
                    console.log(`extract.success:  ${topic}:`, (data as Array<string>).length);
                    break;
                case "download":
                    console.log("downloaded:", data._filename);
                    break;
                default:
                    console.log(`extract.success.default:  ${topic}:`, data);
            }
        },
        "extract.error": function(app: App, resource, handler, error){
            console.log("extract.error@", error.message);
        },
        "extract.failed": function(app: App, resource, handler, error){
            console.log("extract.fail@", error.message);
        },
    },
    extractors: [
        {
            topic: "link",
            match: matcher_for_url(/ooxx/g),
            extractor: extractor_for_link("a[href]", [
                /\/ooxx[\/a-zA-Z0-9]*/g,
            ]),
        },
        {
            topic: "ooxx",
            match: matcher_for_url(/ooxx/g),
            extractor: create_xpath_extractor({
                'images': "//*[contains(@id,'comment-')]/div/div/div[2]/p/a/@href"
            }),
        },
        {
            topic: "download",
            match: matcher_for_url(false),
            extractor: function(response: IResponse){
                return response;
                // let _filename = (resource._extra_attributes as {_filename:string})._filename;

                // return new Promise((resolve, reject) => {
                //     resource.response?.body
                //     .pipe(fs.createWriteStream(_filename))
                //     .on("finish", function(){
                //         resolve(_filename);
                //     })
                //     .on("error", function(err){
                //         reject(err);
                //     });
                // });
            },
        },
    ],
};

export = config;