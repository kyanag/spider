import { Worker } from "./Worker";
import EventEmitter from "events";
import { AsyncBlockingQueue } from "./AsyncBlockingQueue";

interface WorkerRuntimeInfo{
    currentJob ?: Job,
    jobStartAt ?: Date,
    total : number,
}

interface WorkerRuntimeInfos{
    [index: string]: WorkerRuntimeInfo,
}

export class Scheduler extends EventEmitter{
    
    protected workers: Array<Worker>;

    protected queue: AsyncBlockingQueue<Job>;

    protected runtimes : WorkerRuntimeInfos;

    constructor(num: number){
        super();
        this.queue = new AsyncBlockingQueue<Job>();

        this.workers = new Array<Worker>(num);
        for(let i = 0; i < this.workers.length; i++){
            this.workers[i] = new Worker(this, `${i+1}`);
        }

        this.runtimes = {};

        this.on("job.end", (worker: Worker, job: Job, res: boolean) => {
            this.runWorker(worker);
        });
    }

    protected initRuntimeInfos(){
        this.workers.forEach( (worker) => {
            this.runtimes[worker.getName()] = {
                total: 0,
            };
        });
    }

    start(){
        this.initRuntimeInfos();

        this.workers.forEach( worker => {
            this.runWorker(worker);
        });
    }

    addJob(job: Job){
        this.queue.enqueue(job);
    }

    protected runWorker(worker: Worker){
        delete this.runtimes[worker.getName()].currentJob;
        delete this.runtimes[worker.getName()].jobStartAt;

        this.queue.dequeue().then( (job: Job) => {

            this.runtimes[worker.getName()].currentJob = job;
            this.runtimes[worker.getName()].jobStartAt = new Date();

            worker.exec(job);
        });
    }

    getRuntimes(){
        return this.runtimes;
    }
}