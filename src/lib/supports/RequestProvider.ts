import { rejects } from "assert";
import { file } from "../../test/App.test";

const nodeFetch = require("node-fetch");
const {
    Request, 
    Response
} = nodeFetch;
const AbortController = require("abort-controller");


export class FetchRequester implements RequestProvider{

    fetch(irequest: IRequest, timeout: number = 2000): Promise<IResponse>{
        const controller = new AbortController();
        const seed = setTimeout(() => { 
            controller.abort(); 
        }, timeout);

        let request = this.createRequest(irequest);
        return nodeFetch(request, { signal: controller.signal })
            .then( async (response: any) => {
                return await this.toIResponse(response);
            }).finally(() => {
                clearTimeout(seed);
            });
    }

    private createRequest(irequest: IRequest){
        return new Request(irequest.url);
    }

    private async toIResponse(response: FetchResponse): Promise<IRequest>{
        let blob = await response.blob();
        let body = await blob.text();

        let iresponse: IResponse = {
            ok: response.ok,
            url: response.url,
            headers: this.headerToMap(response.headers),
            status: response.status,
            statusText: response.statusText,
            body: body,
            raw: blob,
        };
        return iresponse;
    }

    private async blobToString(blob: Blob, encoding = "utf-8"): Promise<string>{
        return new Promise((resolve, reject) => {
            let fileReader = new FileReader();
            fileReader.onload = (evt) => {
                //@ts-ignore
                resolve(evt.result);
            }
            fileReader.onerror = (err) => {
                //@ts-ignore
                reject(err);
            }
            fileReader.readAsText(blob);
        })
    }

    private headerToMap(headers: Headers){
        let map = new Map<string, string>();
        headers.forEach( (value, key, parent) => {
            map.set(key, value);
        })
        return map;
    }
}