import { Observable, Subject, asapScheduler, pipe, of, from, interval, merge, fromEvent } from 'rxjs';
import { map, filter, timeout, concatMap} from "rxjs/operators";
import EventEmitter from "events";
import lodash from "lodash";

const { FetchRequester } = require("./supports/RequestProvider");

// @ts-ignore
Function.prototype.addMiddleware = function(middleware: (input: any, next: Function) => any): Function{                               
    let core = this;
    return async function(input: any){
        //@ts-ignore
        return middleware.call(this, input, core);
        
        // @ts-ignore
        let _ = await Promise.resolve(last.call(this, ...args));
        // @ts-ignore
        return middleware.call(this, _);
    }
}

Function.prototype.then = function(next: (...args: any[]) => any): (...args: any[]) => any{ 
    let last:Function = this;                                       
    return async function(...args: any[]){
        // @ts-ignore
        let _ = await Promise.resolve(last.call(this, ...args));
        // @ts-ignore
        return next.call(this, _);
    }
}

export class App extends EventEmitter{
    id: string
    private _config: Config;

    private _requestProvider: RequestProvider;

    private subscription: any;
    
    constructor(config: Config){
        super();

        this._config = config;

        this.id = config.id;
        //绑定事件
        let listeners = config.listeners || {};
        for(let name in listeners){
            let handler = listeners[name];
            this.on(name, handler);
        }
        //@ts-ignore
        this._requestProvider = new FetchRequester();
    }

    addResource(resource: Resource){
        this._config.queue.push(resource);
        this.emit("resource.push", this, resource);
    }

    createWorkflow(queue: Queue<Resource>, onInterval: number, onTimeout: number): Observable<Resource>{
        return interval(onInterval).pipe(
            map( () => {
                try{
                    return queue.shift() || null;
                }catch(error){
                    return null;
                }
            }),
            // @ts-ignore
            filter( (value: Resource | null) => {
                return value !== null;
            }),
            timeout(onTimeout),
        )
    }

    createObservable(): Observable<Resource>{
        //@ts-ignore
        return this.createWorkflow(this._config.queue, this._config.interval, this._config.timeout).pipe(
            concatMap(async (resource: Resource) => {
                this.emit("resource.before-fetch", this, resource);
                return this.fetch(resource).then( (resource:Resource) => {
                    if(resource.response === undefined){
                        return null;
                    }
                    return resource;
                })
            }),
            filter( (value: Resource | null) => {
                return value !== null;
            })
        );
    }

    retry(resource: Resource){
        resource._retry += 1;
        resource.response = undefined;

        if(resource._retry < this._config.max_retry_num){
            this.addResource(resource);
        }else{
            this.emit("resource.shift", this, resource);
        }
    }

    /**
     * 请求页面
     */
    async fetch(resource: Resource, timeout: number = 2000): Promise<Resource>{
        this.emit("resource.ready", this, resource);

        return this._requestProvider.fetch(resource.request, timeout).then( (response: IResponse) => {
            resource.response = response;
            this.emit("resource.responded", this, resource);
            return resource;
        }).catch( (error:any) => {
            this.emit("resource.fail", this, resource, error);
            this.retry(resource);
            return resource;
        });
    }

    run(){
        this.emit("app.ready", this);
        this.subscription = this.createObservable().subscribe(
            (resource: Resource) => {
                this._config.extractors.filter( (handler: Handler) => {
                    if(lodash.indexOf(resource._topics, handler.topic) >= 0){
                        return true;
                    }
                    if(handler.regex === null){
                        return false;
                    }
                    return resource.request.url.match(handler.regex) != null;
                }).forEach( (handler: Handler) => {
                    try{
                        let extractor = handler.extractor;
                        Promise.resolve(
                            extractor.call(this, resource)
                        ).then( record => {
                            if(resource._extra_attributes){
                                record = Object.assign(resource._extra_attributes, record);
                            }
                            this.emit("extract.success", this, handler.topic, record, resource, handler);
                        }).catch( error => {
                            this.emit("extract.fail", this, resource, handler, error);
                        })
                    }catch(error){
                        this.emit("extract.error", this, resource, handler, error);
                    }
                })
            }, 
            (error: any) => {
                this.emit("app.error", this, error);
            }
        );
    }

    stop(){
        this.emit("app.before-stop", this);
        this.subscription.unsubscribe();
    }
}