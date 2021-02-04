const httpClient = require("request");
const { filter, concatMap } = require("rxjs/operators");
const EventEmitter = require('events');
const lodash = require("lodash");

const { createWorkflow, Queue } = require("./Core.js");

Function.prototype.addDecorator = function(now){
    let last = this;
    return function(...args){
        let _ = last.call(this, ...args);
        return now.call(this, _);
    }
}
/* 
    队列内容
    {
        request<request.TOptions>: {    //请求参数
            method: "get",
            url: "",
            headers: {},
            ...
        },
        _topics: [],                    //强制主题
        _extra_attributes: {},          //附加属性
        _retry: 0,   //重试次数
    },
*/

class App extends EventEmitter{
    id
    max_retry_num = 5
    interval = 1000             
    timeout = 10000

    constructor(config){
        super();

        this.id = config.id;
        this.max_retry_num = config.max_retry_num;
        this.interval = config.interval;
        this.timeout = config.timeout;

        //加载事件
        let listeners = config.listeners || {};
        for(let name in listeners){
            this.on(name, listeners[name].bind(this));
        }

        //初始化队列
        this._queue = new Queue();
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
        this._queue.push(resource);

        this.emit("resource.push", resource);
    }

    createObservable(){
        return createWorkflow(this._queue, this.interval, this.timeout).pipe(
            concatMap( (resource) => {
                return this.fetch(resource);
            }),
            filter( ({request, response = null, error}) => {
                return error == null;
            }),
        );
    }

    /**
     * fetcher:fetch 下载
     * @param {Object} resource 
     */
    async fetch(resource){
        return await new Promise((resolve, reject) => {
            try{
                let request = resource.request;

                this.emit("request.start", {request});
                httpClient(request, (error, response, body) => {
                    this.emit("request.success", {request, response}, error);
                    resolve({request, response, error, resource})
                })
            }catch(error){
                //失败自动重试
                resource._retry += 1;
                if(resource._retry < this.max_retry_num){
                    this.addResource(resource);
                }
                this.emit("request.error", {request}, error);
                resolve({request, error, resource})
            }
        })
    }

    stop(){
        this.emit("app.before-stop");
        this.subscription.unsubscribe();
    }

    run(){
        this.emit("app.before-start");

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
                        this.emit("extract.success", route.topic, record, {request, response}, resource);
                    }).catch( error => {
                        this.emit("extract.error", error);
                    })
                }catch(error){
                    this.emit("extract.error", error);
                }
            });
        }, (error) => {
            this.emit("app.error", error);
        });
    }
}
module.exports = App;