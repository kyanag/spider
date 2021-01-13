const httpClient = require("request");
const Rx = require("rxjs");
const { map, filter, timeout, concatMap } = require("rxjs/operators");
const EventEmitter = require('events');

let resources = [
    /* 
    {
        reqOtions<request.TOptions>: {
            method: "get",
            url: "",
            headers: {},
            ...
        },
        _retry: 0,   //重试次数
    },
    */
];

class App{
    constructor(config){
        this.$eventEmitter = new EventEmitter();

        //加载事件处理器
        let listeners = config.listeners || {};
        for(let name in listeners){
            this.$eventEmitter.on(name, listeners[name]);
        }

        config.entry.forEach( (url) => {
            this.addResource(url);
        });

        this.config = config;
    }

    addResource(resource){
        if(typeof(resource) == 'string'){
            resource = {
                reqOptions:{
                    method: "get",
                    url: resource,
                    headers: {}
                },
                _retry: 0
            }
        }
        resources.push(resource);

        this.$eventEmitter.emit("resource.push", resource.reqOptions);
    }

    createObservable(){
        let onDelay = this.config.requestDelay;
        let onTimeout = this.config.finishDelay;

        return Rx.interval(onDelay).pipe(
            map( (value) => {
                if(resources.length > 0){
                    return resources.shift();
                }
                return null;
            }),
            filter( (value) => {
                return value !== null;
            }),
            timeout(onTimeout),
            concatMap( (resource) => {
                return this.fetch(resource);
            }),
            filter( ({request, response = null, error}) => {
                return true;
            }),
        )
    }

    getExtractor(name){
        if(typeof(name) =='string'){
            return this.config.extractors[name] || null;
        }
        return name;
    }

    async fetch(resource){
        return await new Promise((resolve, reject) => {
            try{
                let request = resource.reqOptions;

                this.$eventEmitter.emit("request.start", request);
                httpClient(request, (error, response, body) => {
                    this.$eventEmitter.emit("request.finish", request, response, error);
                    resolve({request, response, error})
                })
            }catch(error){
                //失败自动重试
                resource._retry += 1;
                if(resource._retry < this.config.maxRetryNum){
                    this.addResource(resource);
                }
                this.$eventEmitter.emit("request.error", request, error);
                resolve({request, error})
            }
        })
    }

    run(){
        this.createObservable().subscribe( ( {request, response = null, error} ) => {
            //1     打日志
            if(error){
                console.log(error);
                return;
            }
            
            //2     抽取数据
            this.config.routes.filter( (route) => {
                console.log(request.url, route.regex, request.url.match(route.regex) != null);
                return request.url.match(route.regex) != null;
            }).forEach( (route) => {
                try{
                    let extractor = this.getExtractor(route.extractor);
                    //
                    Promise.resolve(
                        extractor(this, {request, response})
                    ).then( record => {
                        let topic = route.topic;
                        switch(topic){
                            case "@link":
                                record.forEach( link => {
                                    this.addResource(link);
                                });
                                break;
                            default:
                                this.$eventEmitter.emit("extract.success", topic, data, {request, response});
                        }
                    })
                }catch(error){
                    this.$eventEmitter.emit("extract.error", error);
                }
            });
        }, (error) => {
            this.$eventEmitter.emit("app.error", error);
        });
    }
}
module.exports = App;