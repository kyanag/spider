import { Scheduler } from "./Scheduler";
import { AsyncBlockingQueue as Channel} from "./AsyncBlockingQueue";
import { resolve } from "path";


export class Worker{
    private scheduler: Scheduler;

    private channel: Channel<Job>;

    private stopResolver: undefined | ((value: unknown) => void);

    private _status: string;

    private _name: string;

    //完成一个任务后，冷却时间
    private _cooldown: number = 0;

    constructor(scheduler: Scheduler, channel: Channel<Job>, name: string) {
        this.scheduler = scheduler;
        this.channel = channel;
        this._name = name;

        this._status = "waiting";
    }

    set cooldown(time: number){
        this._cooldown = time;
    }

    async start(){
        while(true){
            if(this.stopResolver){
                //如果有停止请求
                this._status = "stopping";

                let stopResolver = this.stopResolver;
                this.stopResolver = undefined;
                stopResolver(new Date);

                //跳出循环
                break;
            }
            let job = await this.channel.dequeue();
            //开始事件
            this.getScheduler().emit(Scheduler.EVENT_WORKER_START, this, job);
            this._status = "running";

            let successful = true;
            let result = undefined;
            try{
                result = await Promise.resolve(job.run());;
            }catch(error){
                successful = false;
                //任务异常事件
                this.getScheduler().emit(Scheduler.EVENT_WORKER_FAILED, this, job, error);
            }
            this._status = "waiting";
            //任务结束事件
            this.getScheduler().emit(Scheduler.EVENT_WORKER_END, this, job, successful, result);

            await this.sleep(this._cooldown);
        }
    }

    async sleep(time: number){
        if(time <= 0){
            return 0;
        }else{
            return new Promise( (resolve, reject) => {
                setTimeout(resolve, time);
            });
        }
    }

    /**
     * 发出停止请求
     * @returns 
     */
    async stop(){
        return new Promise( (resolve, reject) => {
            this.stopResolver = resolve;
        });
    }

    getScheduler(){
        return this.scheduler;
    }

    getStatus(){
        return this._status;
    }

    getName(){
        return this._name;
    }
}