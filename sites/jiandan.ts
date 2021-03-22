import { exit } from "node:process";

const { link_extrator_factory,  xpath_extractor_factory } = require("../src/lib/Extractors");
const url = require("url");
const fs = require("fs-extra");
const path = require("path");

let filter: Map<string, boolean> = new Map<string, boolean>();

let queue = new Array<Resource>();

let config: Config = {
    id: "jiandan",
    queue: queue,
    max_retry_num: 5,
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
            queue.push(app.buildResource("http://jandan.net/ooxx", []))
        },
        "app.before-stop": function(app: App){
            
        },
        "app.error": function(app: App, error: any){
            console.log(`app-error: ${JSON.stringify(error)}`);
        },
        "resource.push": function(app: App, resource: Resource){
            console.log(`入队: ${resource.request.url}`);
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
        "extract.success": function(app: App, topic: string, data: any, resource: Resource, handler: Handler){
            console.log(`extract.success:  ${topic}:`, data);
            if(topic == "link"){
                return;
            }
            if(topic == "ooxx"){
                let images = data['images'];
                images.forEach( (image: string) => {
                    image = url.resolve(resource.request.url, image);

                    let newResource = app.buildResource(image, ["download"], {
                        '_filename': path.resolve("./storage/jiandan/images", path.basename(image)),
                    })
                    //console.log("download-debug: ", newResource._extra_attributes['_filename']);
                    app.addResource(newResource);
                });
            }else if(topic == "download"){
                console.log("downloaded:", data);
            }
        },
        "extract.fail": function(app: App, resource, handler, error){
            console.log(error);
        },
        "extract.error": function(app: App, resource: Resource, handler: Handler, error: any){
            console.log(error);
        },
    },
    extractors: [
        {
            topic: "link",
            regex: "",
            extractor: link_extrator_factory({
                patterns: [
                    /\/ooxx[\/a-zA-Z0-9]*/g,
                ]
            }).addDecorator(function(links: Array<string>){
                links.forEach( link => {
                    if(!filter.has(link)){
                        filter.set(link, true);
                        
                        // @ts-ignore
                        let resource = this.buildResource(link);
                        // @ts-ignore
                        this.addResource(resource);
                    }
                })
                return links;
            }),
        },
        {
            topic: "ooxx",  //随手拍
            regex: /ooxx[\/a-zA-Z0-9]*/g,
            extractor: xpath_extractor_factory({
                //'images': `//*[contains(@id,'comment-')]/div/div/div[2]/p/a/@href`,
                'images': "//*[contains(@id,'comment-')]/div/div/div[2]/p/a/@href"
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
            extractor: function(resource: Resource){
                let save_as = resource._extra_attributes['_filename'];
                //console.log(response.headers['content-type']);
                // @ts-ignore
                fs.writeFileSync(save_as, resource.response.raw);
                return {
                    save_as
                };
            },
        },
    ],
    interval: 1 * 1000,             //请求间隔时间
    timeout: 10 * 1000,             //队列空置 ${x} 微秒后退出
};

export = config;