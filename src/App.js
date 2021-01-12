const httpClient = require("request");
const Rx = require("rxjs");
const { map, filter, timeout, concatMap } = require("rxjs/operators");

let resources = [
    // {
    //     reqOtions<request.TOptions>: {
    //         method: "get",
    //         url: "",
    //         headers: {},
    //     },
    //     _retry: 0,   //重试次数
    // },
];

class App{

    constructor(config){
        this.config = config;

        config.entry.forEach( (url) => {
            this.addResource(url);
        });
    }

    addResource(resource){
        if(typeof(resource) == 'string'){
            resource = {
                reqOptions:{
                    method: "get",
                    url: resource,
                    headers: {}
                },
                _retry: 0
            }
        }
        resources.push(resource);
    }

    createObservable(){
        let onDelay = this.config.requestDelay;
        let onTimeout = this.config.finishDelay;

        return Rx.interval(onDelay).pipe(
            map( (value) => {
                if(resources.length > 0){
                    return resources.shift();
                }
                return null;
            }),
            filter( (value) => {
                return value !== null;
            }),
            timeout(onTimeout),
            concatMap( (resource) => {
                return this.fetch(resource);
            }),
        )
    }

    getExtractor(name){
        return this.config.extractors[name] || null;
    }

    async fetch(resource){
        return await new Promise((resolve, reject) => {
            try{
                let request = resource.reqOptions;
                httpClient(request, function(error, response, body){
                    resolve({request, response, error})
                })
            }catch(error){
                resource._retry += 1;
                if(resource._retry < this.config.maxRetryNum){
                    this.addResource(resource);
                }
                resolve({request, error})
                console.log(error);
            }
        })
    }

    run(){
        this.createObservable().subscribe( ( {request, response, error} ) => {
            //1     打日志
            if(error){
                console.warn(`[${new Date}][×] ${request.url}`)
                return;
            }
            console.log( `[${new Date}][√] ${request.url}`)
            
            //2     抽取数据
            let routes = this.config.routes().filter( (route) => {
                return request.url.match(route.regex)
            }).each( (route) => {
                let extractors = route.extractors;


            });
            //3     保存数据
            //4.    结束
            

        }, (error) => {
            console.log("超过时限没有", new Date);
        });
    }
}
module.exports = App;