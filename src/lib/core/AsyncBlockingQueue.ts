/**
 * @desc 异步阻塞队列
 * @copyfrom `https://github.com/carlhopf/async-blocking-queue`
 */
export class AsyncBlockingQueue<T> {
    
    protected resolvers: Array<(value: T | PromiseLike<T>) => void>;

    protected promises: Array<Promise<T>>;

    constructor() {
        this.resolvers = [];
        this.promises = [];
    }
  
    _push() {
        this.promises.push(
            new Promise(resolve => {
                this.resolvers.push(resolve);
            })
        );
    }
  
    enqueue(t: T) {
        if (!this.resolvers.length) {
            this._push();
        }
        let resolve = this.resolvers.shift();
        (resolve as (value: T | PromiseLike<T>) => void)(t);
    }
  
    dequeue(): Promise<T> {
        if (!this.promises.length) {
            this._push();
        }
        return this.promises.shift() as Promise<T>;
    }
}