const Rx = require("rxjs");
const { map, filter, timeout, concatMap } = require("rxjs/operators");


let Queue = Array;

/**
 * 
 * @param {Array} resources 
 * @param {int} onInterval 
 * @param {int} onTimeout
 * @return {Rx.Observable}
 */
let createWorkflow = function(resources, onInterval = 1000, onTimeout = 100000){
    return Rx.interval(onInterval).pipe(
        map( i => {
            try{
                return resources.shift() || null;
            }catch(error){
                return null;
            }
        }),
        filter( value => {
            return value !== null;
        }),
        timeout(onTimeout),
    )
}


module.exports = {
    createWorkflow,
    Queue,
};