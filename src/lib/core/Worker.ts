import { Scheduler } from "./Scheduler";

export class Worker{
    private scheduler: Scheduler;

    private name: string;

    private _isRunning : boolean;

    constructor(scheduler: Scheduler, name: string) {
        this.scheduler = scheduler;
        this.name = name;
        this._isRunning = false;
    }

    async exec(job: Job) {
        this.getScheduler().emit("job.start", this, job);
        this._isRunning = true;
        return Promise.resolve(job.run()).then(
            (res) => {
                this._isRunning = false;
                this.getScheduler().emit("job.end", this, job, true);
            }
        ).catch(
            (error) => {
                this._isRunning = false;
                this.getScheduler().emit("job.end", this, job, false);
                this.getScheduler().emit("job.failed", this, job, error);
            }
        );
    }

    getScheduler(){
        return this.scheduler;
    }

    getName(){
        return this.name;
    }

    isRunning(){
        return this._isRunning;    
    }
}