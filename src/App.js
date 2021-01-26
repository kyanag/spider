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

    /**
     * 
     * @param {Object|String} resource      url
     * @param {String|Array} topic                强制主题
     * @param {Object} extra_attributes     附加数据   
     */
    addResource(resource, topic = null, extra_attributes = undefined){
        if(typeof(topic) == "string"){
            topic = [topic];
        }
        if(typeof(resource) == 'string'){
            resource = {
                reqOptions:{
                    method: "get",
                    url: resource,
                    headers: {},
                    timeout: 5000
                },
                _topic: topic,                          //强制主题
                _extra_attributes: extra_attributes,
                _retry: 0,
            }
        }
        resources.push(resource);

        this.$eventEmitter.emit("resource.push", resource, this);
    }

    createObservable(){
        let onDelay = this.config.requestDelay;
        let onTimeout = this.config.finishDelay;

        
        return Rx.interval(onDelay).pipe(
            map( (value, ...args) => {
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
                return error == null;
            }),
        )
    }

    async download(resource){
        return await new Promise((resolve, reject) => {
            try{
                let request = resource.reqOptions;

                this.$eventEmitter.emit("request.start", request, this);
                httpClient(request, (error, response, body) => {
                    this.$eventEmitter.emit("request.success", request, response, error, this);
                    resolve({request, response, error, resource})
                })
            }catch(error){
                //失败自动重试
                resource._retry += 1;
                if(resource._retry < this.config.maxRetryNum){
                    this.addResource(resource);
                }
                this.$eventEmitter.emit("request.error", request, error, this);
                resolve({request, error, resource})
            }
        })
    }

    async fetch(resource){
        return await new Promise((resolve, reject) => {
            try{
                let request = resource.reqOptions;

                this.$eventEmitter.emit("request.start", request, this);
                httpClient(request, (error, response, body) => {
                    this.$eventEmitter.emit("request.success", request, response, error, this);
                    resolve({request, response, error, resource})
                })
            }catch(error){
                //失败自动重试
                resource._retry += 1;
                if(resource._retry < this.config.maxRetryNum){
                    this.addResource(resource);
                }
                this.$eventEmitter.emit("request.error", request, error, this);
                resolve({request, error, resource})
            }
        })
    }

    stop(){
        this.$eventEmitter.emit("app.before-stop", this);
        this.subscription.unsubscribe();
    }

    run(){
        this.$eventEmitter.emit("app.before-start", this);

        this.subscription = this.createObservable().subscribe( ( {request, response = null, error, resource} ) => {
            this.config.routes.filter( (route) => {
                //强制 topic

                return request.url.match(route.regex) != null;
            }).forEach( route => {
                try{
                    let extractor = this.getExtractor(route.extractor);
                    //
                    Promise.resolve(
                        extractor(this, {request, response}, resource)
                    ).then( record => {
                        if(resource._extra_attributes){
                            record = Object.assign(resource._extra_attributes, record);
                        }
                        this.$eventEmitter.emit("extract.success", route.topic, record, {request, response}, resource, this);
                    })
                }catch(error){
                    this.$eventEmitter.emit("extract.error", error, this);
                }
            });
        }, (error) => {
            this.$eventEmitter.emit("app.error", error, this);
        });
    }
}
module.exports = App;