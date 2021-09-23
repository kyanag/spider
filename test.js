let {Scheduler} = require("./build/src/lib/core/Scheduler");

let { AsyncBlockingQueue } = require("./build/src/lib/core/AsyncBlockingQueue");

let scheduler = new Scheduler(4);
let Job = function(){
    this.run = function(){
        return new Promise( (resolve) => {
            setTimeout( () => {
                console.log((new Date).toLocaleTimeString());
                resolve(true);
            }, 1000);
        })
    };
};
scheduler.start();

let job = new Job();
scheduler.addJob(job);
setTimeout( function(){

}, 10000);


