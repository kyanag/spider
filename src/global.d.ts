import App from './lib/App';
import {
    Request,
    Response,
    Headers,
} from "node-fetch";

declare global{
    interface Function{
        //后续
        then(func: (...args: any[]) => any): (...args: any[]) => any;
        // //中间件
        // addMiddleware(func: (...args: any[]) => any): (...args: any[]) => any
    }

    //队列
    declare interface Queue<T> {
        pop: () => T | undefined,           //头部出队
        shift: () => T | undefined,         //尾部出队
        push: (...items: T[]) => number     //头部插入
    };

    declare type App = App;

    declare type FetchRequest = Request;
    declare type FetchResponse = Response;
    declare type FetchHeaders = Headers;

    declare type Matcher = (resource: Resource) => boolean;

    //过滤器
    declare interface Filter<T>{
        exists: (T) => boolean,             //是否存在
        add: (T) => void,                   //过滤器插入
    }

    declare interface IRequest{
        method: string,
        url: string,
        headers?: Map<string, string>,
    }

    declare interface IResponse{
        ok: boolean,
        url: string,
        status: number,
        statusText: string,
        headers: Map<string, string>,
        body: NodeJS.ReadableStream,
        text?: string,
    }

    declare interface RequestProvider{
        fetch(request: IRequest, timeout: number): Promise<IResponse>
    }

    declare interface Resource{
        request: IRequest,
        response?: IResponse,
        error?: any,
        _topics: Array<string>,
        _extra_attributes?: Object,
        _retry: number, 
    }

    declare interface Handler{
        topic: string,
        match : Matcher,
        extractor: (resource: Resource) => Promise<any> | any,
    }

    declare interface Config{
        id: string,                                 //id
        queue: Queue<Resource>,                     //队列
        max_retry_num: number,                      //Resource 最大重试次数
        interval: number,                           //请求间隔时间
        timeout: number,                            //队列空闲 N 微秒后退出
        listeners: Events,                          //事件监听
        extractors: Array<Handler>                  //抽取器
    }

    declare interface Events{
        [index: string]: (...args: any[]) => any,

        //App ready
        "app.ready"? : (app: App) => void,
        //App 停止
        "app.before-stop"? : (app: App) => void,
        //App 退出Rx循环
        "app.error"? : (app: App, error:any) => void,
        
        //resource 入队
        "resource.push"? : (app: App, resource: Resource) => void,
        //resource 出队 - 超过最大次数或者被主动抛弃
        "resource.shift"? : (app: App, resource: Resource) => void,
        //resource 发出请求之前
        "resource.ready"? : (app: App, resource: Resource) => void,
        //resource request 返回结果 无论状态码是多少
        "resource.responded"? : (app: App, resource: Resource) => void,
        //resource 请求失败
        "resource.fail"? : (app: App, resource: Resource, error: any) => void,               

        //抽取器 抽取数据成功
        "extract.success"? : (app: App, topic: string, data: any, resource: Resource, handler: Handler) => void,
        //抽取器 抽取失败
        "extract.fail"? : (app: App, resource: Resource, handler: Handler, error: any) => void,
    }

}

