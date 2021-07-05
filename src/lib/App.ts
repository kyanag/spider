import { Observable, interval} from 'rxjs';
import { map, filter, timeout, concatMap} from "rxjs/operators";
import EventEmitter from "events";

const { BasicClient } = require("./supports/BasicClient");

export class App extends EventEmitter{
    id: string
    private _config: Config;

    // private queue: Queue<Resource>;

    private client: Client;

    private subscription: any;
    
    constructor(config: Config){
        super();

        this._config = config;

        this.id = config.id;
        //绑定事件
        let listeners = config.listeners || {};
        for(let name in listeners){
            //@ts-ignore
            let handler = listeners[name];
            this.on(name, handler);
        }
        this.client = new BasicClient();
    }

    addResource(resource: Resource){
        this._config.queue.push(resource);
        this.emit("resource.push", this, resource);
    }

    createWorkflow(queue: Queue<Resource>, onInterval: number, onTimeout: number, onWarning: number = 0): Observable<Resource>{
        if(onWarning == 0){
            onWarning = Math.round(onTimeout / 2000) * 1000;
        }
        let countWarningTime = 0;

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
                if(value === null){
                    countWarningTime += onInterval;
                    if(countWarningTime >= onWarning){
                        this.emit("app.warning");
                    }
                }else{
                    countWarningTime = 0;
                }
                return value !== null;
            }),
            timeout(onTimeout),
        )
    }

    createObservable(): Observable<IResponse>{
        //@ts-ignore
        return this.createWorkflow(this._config.queue, this._config.interval, this._config.timeout).pipe(
            concatMap(async (resource: Resource) => {
                this.emit("resource.ready", this, resource);
                return this.client.fetch(resource.request, 2000).then( (response: IResponse) => {
                    response.resource = resource;
                    response.request = resource.request;
                    
                    this.emit("resource.responded", this, resource, response);
                    return response;
                }).catch( (error: any) => {
                    this.emit("resource.failed", this, resource, error);
                    return null;
                })
            }),
            filter( (value: IResponse | null) => {
                return value !== null;
            })
        );
    }

    retry(resource: Resource){
        resource._retry += 1;

        if(resource._retry < this._config.max_retry_num){
            this.addResource(resource);
        }else{
            this.emit("resource.shift", this, resource);
        }
    }

    run(){
        this.emit("app.ready", this);
        this.subscription = this.createObservable().subscribe(
            (response: IResponse) => {
                this._config.extractors.filter( (handler: Handler) => {
                    if(response.resource._topics.indexOf(handler.topic) >= 0){
                        return true;
                    }
                    return handler.match(response);
                }).forEach( (handler: Handler) => {
                    this.emit("response.matched", this, response, handler);
                    try{
                        let extractor = handler.extractor;
                        Promise.resolve(
                            extractor.call(this, response)
                        ).then( record => {
                            this.emit("extract.success", this, handler.topic, record, response, handler);
                        }).catch( error => {
                            this.emit("extract.fail", this, response, handler, error);
                        })
                    }catch(error){
                        this.emit("extract.error", this, response, handler, error);
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