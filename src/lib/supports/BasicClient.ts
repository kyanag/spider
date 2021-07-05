const nodeFetch = require("node-fetch");
const {
    Request, 
    Response
} = nodeFetch;
const AbortController = require("abort-controller");


export class BasicClient implements Client{

    fetch(irequest: IRequest, timeout: number = 2000): Promise<IResponse>{
        const controller = new AbortController();
        const seed = setTimeout(() => { 
            controller.abort();
        }, timeout);

        let request = this.createRequest(irequest);
        return nodeFetch(request, { signal: controller.signal })
            .then( async (response: any) => {
                return await this.toIResponse(irequest, response);
            }).finally(() => {
                clearTimeout(seed);
            });
    }

    private createRequest(irequest: IRequest){
        return new Request(irequest.url);
    }
    
    private async toIResponse(request: IRequest, response: Response): Promise<IResponse>{
        let iresponse: IResponse = {
            request: request,
            ok: response.ok,
            url: response.url,
            headers: this.headerToMap(response.headers),
            status: response.status,
            statusText: response.statusText,
            //@ts-ignore
            body: response.body,
            isText: false,
            text: undefined,
        };
        if(
            iresponse.headers.has("content-type") && 
            (
                iresponse.headers.get('content-type')?.match(/^text.*/g)
                ||
                iresponse.headers.get('content-type')?.match(/charset/g)
            )
        ){
            iresponse.isText = true;
            iresponse.text = await response.text();
        }
        return iresponse;
    }

    private headerToMap(headers: Headers){
        let map = new Map<string, string>();
        headers.forEach( (value, key) => {
            map.set(key, value);
        })
        return map;
    }
}