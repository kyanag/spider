import url from "url";
import fs from "fs-extra";
import path from "path";
import {
    create_resource_from_url,
    link_extrator_factory,
    xpath_extractor_factory,
    json_extractor_factory,
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
        "resource.responded": function(app: App, resource:Resource){
            //@ts-ignore
            //console.log(resource.response.body);
        },
        "resource.fail": function(app: App, resource:Resource, error: any){
            console.log(`resource.fail: ${resource.request.url}`, error);
        },
        "extract.success": function(
            app: App, 
            topic: string, 
            data: any, 
            resource: Resource, 
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
        "extract.fail": function(app: App, resource, handler, error){
            console.log(error.message);
        },
    },
    extractors: [
        {
            topic: "link",
            regex: /ooxx[\/a-zA-Z0-9]*/g,
            extractor: function(resource: Resource){
                let links = (link_extrator_factory("a[href]", [
                    /\/ooxx[\/a-zA-Z0-9]*/g,
                ]))(resource);
                return (links as Array<string>).map( link => {
                    return url.resolve(resource.request.url, link);
                }).filter( link => {
                    if(filter.has(link)){
                        return false;
                    }

                    // @ts-ignore
                    let resource = create_resource_from_url(link);
                    filter.add(link);
                    // @ts-ignore
                    this.addResource(resource);

                    return true;
                })
            },
        },
        {
            topic: "ooxx",  //随手拍
            regex: /ooxx[\/a-zA-Z0-9]*/g,
            extractor: function(resource: Resource){
                let data = (xpath_extractor_factory({
                    'images': "//*[contains(@id,'comment-')]/div/div/div[2]/p/a/@href"
                }))(resource);

                let images = data['images'];
                return images.map( (image: string) => {
                    return url.resolve(resource.request.url, image);
                }).filter( (image: string) => {
                    if(filter.has(image)){
                        return false;
                    }
                    //@ts-ignore
                    let newResource = create_resource_from_url(image, ["download"], {
                        '_filename': path.resolve("./storage/jiandan/images", path.basename(image)),
                    })
                    //@ts-ignore
                    this.addResource(newResource);

                    return true;
                });
            },
        },
        {
            topic: "download",
            regex: null,
            /**
             * 
             * @param {Request, Response} param0 
             * @param {Array} resource 
             */
            extractor: function(resource: Resource){
                //@ts-ignore
                let _filename = (resource._extra_attributes as Object)._filename;

                return new Promise((resolve, reject) => {
                    resource.response?.body
                    .pipe(fs.createWriteStream(_filename))
                    .on("finish", function(){
                        resolve(_filename);
                    })
                    .on("error", function(err){
                        reject(err);
                    });
                });
            },
        },
    ],
};

export = config;