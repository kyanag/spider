const Rx = require("rxjs");
const { map, filter, timeout, concatMap } = require("rxjs/operators");
const EventEmitter = require('events');
const lodash = require("lodash");

const fetch = require("node-fetch");                // @ts-ignore  
const {Request, Response, Headers} = fetch;         // @ts-ignore

Function.prototype.addDecorator = function(now: Function){  // @ts-ignore
    let last:Function = this;                               // @ts-ignore
    return function(...args: any){                          // @ts-ignore
        let _ = last.call(this, ...args);                   // @ts-ignore
        return now.call(this, _);                           // @ts-ignore
    }                                                       // @ts-ignore
}                                                           // @ts-ignore



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
interface Resource{
    request: Request,
    response?: Response,
    _topics: Array<string>,
    _extra_attributes: any,
    _retry: number, 
}

interface Handler{
    topic: string,
    regex: string | RegExp,
    extractor: Function,
}

interface Events{
    [index: string]: Function
    
    ["app.ready"] : Function,                //App ready
    ["app.before-stop"] : Function,          //App 停止
    ["app.error"] : Function,                //App 退出Rx循环事件
    
    ["resource.push"] : Function,           //resource 入队
    ["resource.shift"] : Function,          //resource 出队 - 超过最大次数或者被主动抛弃
    ["resource.ready"] : Function,          //resource 发出请求之前
    ["resource.responded"]: Function,        //resource.request 返回结果
    ["resource.success"] : Function,        //resource request成功，且状态码为20x
    ["resource.warning"] : Function,        //resource http请求成功，但是状态码不对
    ["resource.fail"] : Function,           //resource 请求失败

    ["extract.success"] : Function,          //抽取器 抽取数据成功
    ["extract.fail"] : Function,             //抽取器 抽取失败
}

interface Config{
    id: string,
    entry: Array<string|Resource>,
    max_retry_num: number,
    interval: number,
    timeout: number,
    listeners: Events,
    extractors: Array<Handler>
}

class Queue<T> extends Array<T>{
    constructor(){
        super(...arguments)
    }
}

class App extends EventEmitter{
    id: string
    max_retry_num: number = 5
    interval: number = 1000             
    timeout: number = 10000
    extractors: Array<Handler>
    private _queue: Queue<Resource>;

    constructor(config: Config){
        super();

        this.id = config.id;
        this.max_retry_num = config.max_retry_num;
        this.interval = config.interval;
        this.timeout = config.timeout;
    
        this.extractors = config.extractors
        //绑定事件
        let listeners = config.listeners || {};
        for(let name in listeners){
            let handler = listeners[name];
            this.on(name, handler.bind(this));
        }

        //初始化队列
        this._queue = new Queue<Resource>();
        config.entry.forEach( (resource) => {
            this.addResource(resource);
        });

        this.config = config;
    }

    addResource(resource: Resource|string, topics: Array<string> = [], extra_attributes = null){
        if(typeof(topics) == "string"){
            topics = [topics];
        }
        if(typeof(resource) == 'string'){
            resource = {
                request: new Request(resource),
                _topics: topics,                            //强制主题
                _extra_attributes: extra_attributes,        //附加属性
                _retry: 0,                                  //重试次数
            }
        }
        this._queue.push(resource);

        this.emit("resource.push", resource);
    }

    createWorkflow(queue: Queue<Resource>, onInterval: number, onTimeout: number){
        return Rx.interval(onInterval).pipe(
            map( () => {
                try{
                    return queue.shift() || null;
                }catch(error){
                    return null;
                }
            }),
            filter( (value: Resource | null) => {
                return value !== null;
            }),
            timeout(onTimeout),
        )
    }

    createObservable(){
        return this.createWorkflow(this._queue, this.interval, this.timeout);
    }

    retry(resource: Resource){
        resource._retry += 1;
        if(resource._retry < this.max_retry_num){
            this.addResource(resource);
        }else{
            this.emit("resource.shift", resource);
        }
    }

    stop(){
        this.emit("app.before-stop");
        this.subscription.unsubscribe();
    }

    /**
     * fetcher:fetch 下载
     * @param {Object} resource 
     */
    async fetch(resource: Resource): Promise<Resource>{
        this.emit("resource.ready", resource);
        return fetch(resource.request).then( response => {
                resource.response = response;
                this.emit("resource.responded", resource);
                return resource;
            }).catch( error => {
                this.emit("resource.fail", resource, error);
                this.retry(resource);
                return resource;
            })
    }

    run(){
        this.emit("app.before-start");
        this.subscription = this.createObservable().pipe(
            concatMap((resource: Resource) => {
                this.emit("resource.before-fetch", resource);
                return this.fetch(resource).then( (resource:Resource) => {
                    if(resource.response === undefined){
                        return null;
                    }
                    if(resource.response.ok){
                        this.emit("resource.success", resource);
                    }else{
                        this.emit("resource.warning", resource);
                    }
                    return resource;
                })
            }),
            filter( (value: Resource|null) => {
                return value !== null;
            })
        ).subscribe( (resource: Resource) => {
            console.log("before-extrate", resource.request.url);
                //if()
            this.extractors.filter((handler: Handler) => {

            }).forEach( (handler: Handler) => {

            })
            return;
            // this.emit("resource.before-fetch", resource);
            // this.fetch(resource).then( (resource:Resource) => {
            //     if(resource.response === undefined){
            //         return Promise.reject(resource);
            //     }
            //     if(resource.response.ok){
            //         this.emit("resource.success", resource);
            //     }else{
            //         this.emit("resource.warning", resource);
            //     }
            //     return resource;
            // }).then( resource => {

            // }).catch


            // this.config.routes.filter( (route) => {
            //     //强制 topic
            //     if(lodash.indexOf(resource._topics, route.topic) >= 0){
            //         return true;
            //     }
            //     return request.url.match(route.regex) != null;
            // }).forEach( route => {
            //     try{
            //         /**
            //          * @var {Function} extractor
            //          */
            //         let extractor = route.extractor;
            //         //
            //         Promise.resolve(
            //             extractor.call(this, {request, response}, resource)
            //         ).then( record => {
            //             if(resource._extra_attributes){
            //                 record = Object.assign(resource._extra_attributes, record);
            //             }
            //             this.emit("extract.success", route.topic, record, {request, response}, resource);
            //         }).catch( error => {
            //             this.emit("extract.error", error);
            //         })
            //     }catch(error){
            //         this.emit("extract.error", error);
            //     }
            // });
        }, (error: any) => {
            this.emit("app.error", error);
        });
    }
}
module.exports = App;