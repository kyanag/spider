//队列
type Queue<T> = {
    pop: () => T | undefined,           //头部出队
    shift: () => T | undefined,         //尾部出队
    push: (...items: T[]) => number     //头部插入
};

type App = {
    addResource: (resource: Resource) => void,
    buildResource: (url: string, topics?: Array<string> = [], extra_attributes?: Object) => Resource,
}

type FetchRequest = Request;
type FetchResponse = Response;
type FetchHeaders = Headers;

//过滤器
type Filter<T> = {
    exists: (T) => boolean,             //是否存在
    add: (T) => void,                   //过滤器插入
}

interface Resource{
    request: FetchRequest,
    response?: FetchResponse,
    error?: any,
    html?: string,
    _topics: Array<string>,
    _extra_attributes: any,
    _retry: number, 
}

interface Handler{
    topic: string,
    regex: string | RegExp,
    extractor: (resource: Resource) => Promise<any> | any,
}

interface Config{
    id: string,                                 //id
    queue: Queue<Resource>,                     //队列
    max_retry_num: number,                      //Resource 最大重试次数
    interval: number,                           //请求间隔时间
    timeout: number,                            //队列空闲 N 微秒后退出
    listeners: Events,                          //事件监听
    extractors: Array<Handler>                  //抽取器
}

interface Index{
    [index:string]: any
}

interface Events{
    //this: App,
    [index: string]: Function
    
    //App ready
    ["app.ready"] : (app: App) => void,
    //App 停止
    ["app.before-stop"] : (app: App) => void,
    //App 退出Rx循环
    ["app.error"] : (app: App, error:any) => void,
    
    //resource 入队
    ["resource.push"] : (app: App, resource: Resource) => void,
    //resource 出队 - 超过最大次数或者被主动抛弃
    ["resource.shift"] : (app: App, resource: Resource) => void,
    //resource 发出请求之前
    ["resource.ready"] : (app: App, resource: Resource) => void,
    //resource request 返回结果
    ["resource.responded"]: (app: App, resource: Resource) => void,
    //resource request 成功，且状态码为20x
    ["resource.success"] : (app: App, resource: Resource) => void,
    //resource request 成功，但状态码不为20x
    ["resource.warning"] : (app: App, resource: Resource) => void,
    //resource 请求失败
    ["resource.fail"] : (app: App, resource: Resource, error: any) => void,               

    //抽取器 抽取数据成功
    ["extract.success"] : (app: App, topic: string, data: any, resource: Resource, handler: Handler) => void,
    //抽取器 抽取失败
    ["extract.fail"] : (app: App, resource: Resource, handler: Handler, error: any) => void,
}

