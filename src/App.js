const httpClient = require("request");
const Rx = require("rxjs");
const { map, filter, timeout, concatMap } = require("rxjs/operators");
const EventEmitter = require('events');
const lodash = require("lodash");


Function.prototype.addDecorator = function(now){
    let last = this;
    return function(...args){
        let _ = last.call(this, ...args);
        return now.call(this, _);
    }
}

let resources = [
    /* 
    {
        reqOtions<request.TOptions>: {
            method: "get",
            url: "",
            headers: {},
            ...
        },
        _topics: [],
        _extra_attributes: {},
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
     * @param {String|Array} topics         强制主题
     * @param {Object} extra_attributes     附加数据
     * @param {String} save_as              保存到地址
     */
    addResource(resource, topics = null, extra_attributes = null){
        if(typeof(topics) == "string"){
            topics = [topics];
        }
        if(typeof(resource) == 'string'){
            resource = {
                request:{
                    method: "get",
                    url: resource,
                    headers: {},
                    timeout: 5000,
                    encoding: null,
                },
                _topics: topics,                            //强制主题
                _extra_attributes: extra_attributes,        //附加属性
                _retry: 0,                                  //重试次数
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

    /**
     * fetcher:fetch 下载
     * @param {Object} resource 
     */
    async fetch(resource){
        return await new Promise((resolve, reject) => {
            try{
                let request = resource.request;

                this.$eventEmitter.emit("request.start", {request}, this);
                httpClient(request, (error, response, body) => {
                    this.$eventEmitter.emit("request.success", {request, response}, error, this);
                    resolve({request, response, error, resource})
                })
            }catch(error){
                //失败自动重试
                resource._retry += 1;
                if(resource._retry < this.config.max_retry_num){
                    this.addResource(resource);
                }
                this.$eventEmitter.emit("request.error", {request}, error, this);
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
                if(lodash.indexOf(resource._topics, route.topic) >= 0){
                    return true;
                }
                return request.url.match(route.regex) != null;
            }).forEach( route => {
                try{
                    /**
                     * @var {Function} extractor
                     */
                    let extractor = route.extractor;
                    //
                    Promise.resolve(
                        extractor.call(this, {request, response}, resource)
                    ).then( record => {
                        if(resource._extra_attributes){
                            record = Object.assign(resource._extra_attributes, record);
                        }
                        this.$eventEmitter.emit("extract.success", route.topic, record, {request, response}, resource, this);
                    }).catch( error => {
                        this.$eventEmitter.emit("extract.error", error, this);
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