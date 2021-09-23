import EventEmitter from "events";
import { Scheduler } from './core/Scheduler';
import { Worker } from "./core/Worker";

const { BasicClient } = require("./supports/BasicClient");

class ResourceJob implements Job{
    private app: App;
    private resource: Resource;

    constructor(app: App, resource: Resource) {
        this.app = app;
        this.resource = resource;
    }

    run(){
        let resource = this.resource;

        return this.app.getClient().fetch(resource.request, 2000).then( 
            (response: IResponse) => {
                response.resource = resource;
                response.request = resource.request;
                
                this.app.emit("resource.responded", this.app, resource, response);
                return this.extract(response);
            },
            (error: any) => {
                this.app.emit("resource.failed", this.app, resource, error);
                return null;
            }
        ).catch( 
            (error: any) => {
                this.app.emit("app.error", this.app, error);
            }
        );
    }

    extract(response: IResponse){
        this.app.getExtractors().filter( (extractor: Extractor) => {
            if(response.resource._topics.indexOf(extractor.topic) >= 0){
                return true;
            }
            return extractor.match(response);
        }).forEach( (extractor: Extractor) => {
            this.app.emit("response.matched", this.app, response, extractor);
            try{
                let func = extractor.extract;
                Promise.resolve(
                    func.call(this, response)
                ).then( record => {
                    this.app.emit("extract.success", this.app, extractor.topic, record, response, extractor);
                }).catch( error => {
                    this.app.emit("extract.fail", this.app, response, extractor, error);
                })
            }catch(error){
                this.app.emit("extract.error", this.app, response, extractor, error);
            }
        })
    }
}

export class App extends EventEmitter{
    id: string
    private _config: Config;

    // private queue: Queue<Resource>;

    private client: Client;

    private scheduler: Scheduler;

    private queue: Set<Resource>;
    
    constructor(config: Config){
        super();

        this._config = config;

        this.id = config.id;
        //绑定事件
        let listeners = config.listeners || {};
        for(let name in listeners){
            //@ts-ignore
            let extractor = listeners[name];
            this.on(name, extractor);
        }
        this.client = new BasicClient();

        this.scheduler = new Scheduler(config.nums);
        this.queue = new Set<Resource>();
    }

    getClient(){
        return this.client;
    }

    getExtractors(){
        return this._config.extractors;
    }

    addResource(resource: Resource){
        this.queue.add(resource);
        this.emit("resource.push", this, resource);

        console.log(resource.request.url);
        this.scheduler.addJob(this.buildJob(resource));
    }

    protected buildJob(resource: Resource){
        return new ResourceJob(this, resource);
    }

    protected eventInit(){
        let runningWorkerCount = 0;

        this.on(Scheduler.EVENT_WORKER_START, (worker: Worker, job: Job, res: boolean) => {
            runningWorkerCount++;
        })

        this.on(Scheduler.EVENT_WORKER_END, (worker: Worker, job: Job, res: boolean) => {
            runningWorkerCount--;
        });
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
        this.scheduler.start();
        setInterval( () => {
            this.ui();
        }, 1000);
    }

    ui(){
        //TODO
    }

    stop(){
        this.emit("app.before-stop", this);
    }
}