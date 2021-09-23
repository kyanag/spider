import { Worker } from "./Worker";
import EventEmitter from "events";
import { AsyncBlockingQueue } from "./AsyncBlockingQueue";

interface WorkerRuntimes{
    [index:string]: {
        current_job: Job | undefined,
        success_count: number,
        failed_count: number,
    }
}

export class Scheduler extends EventEmitter{

    static EVENT_WORKER_START = "scheduler.worker.start";
    static EVENT_WORKER_END = "scheduler.worker.end";
    static EVENT_WORKER_FAILED = "scheduler.worker.failed";

    static EVENT_JOB_ADD = "scheduler.job.add";

    protected queue: AsyncBlockingQueue<Job>;

    protected workers: Array<Worker>;

    protected workerRuntimes: WorkerRuntimes;

    constructor(num: number){
        super();
        this.queue = new AsyncBlockingQueue<Job>();

        this.workers = new Array<Worker>();
        this.workerRuntimes = {};

        for(let i = 0; i < num; i++){
            let worker = new Worker(this, this.queue, `base-${i}`);

            this.workers.push(worker);
            this.workerRuntimes[worker.getName()] = {
                current_job : undefined,
                success_count: 0,
                failed_count : 0,
            };
        }

        this.eventInit();
    }

    protected eventInit(){
        //维护[workerRuntimes]状态
        this.on(Scheduler.EVENT_WORKER_START, (worker: Worker, job: Job) => {
            this.workerRuntimes[worker.getName()]['current_job'] = job;
        })

        this.on(Scheduler.EVENT_WORKER_END, (worker: Worker, job: Job, successful: boolean, result: any) => {
            if(successful){
                this.workerRuntimes[worker.getName()]['success_count'] += 1;
            }else{
                this.workerRuntimes[worker.getName()]['failed_count'] += 1;
            }
            this.workerRuntimes[worker.getName()]['current_job'] = undefined;
        })
    }

    start(){
        this.workers.forEach( (worker, index) => {
            worker.start();
        });
    }

    addJob(job: Job){
        this.queue.enqueue(job);

        this.emit(Scheduler.EVENT_JOB_ADD, job);
    }

    getWorkers(){
        return this.workers;
    }

    getWorkerRuntime(){
        return this.workerRuntimes;
    }
}