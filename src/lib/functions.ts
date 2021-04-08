import url from "url";
import Evaluator from "./supports/Evaluator";

interface StringIndexTypes<T>{
    [index: string]: T,
}


export function create_resource_from_url(url: string, topics: Array<string> = [], extra_attributes?: Object): Resource{
    let resource: Resource = {
        request: {
            method: "get",
            url: url,
        },
        _topics: topics,                            //强制主题
        _extra_attributes: extra_attributes,        //附加属性
        _retry: 0,                                  //重试次数
    }
    return resource;
}


export function extractor_by_xpath(xpath_selectors: StringIndexTypes<any>){
    return function(resource: Resource){
        // @ts-ignore
        let evaluator = new Evaluator(resource.response);
        let _:StringIndexTypes<any> = {};
        for(let i in xpath_selectors){
            _[i] = evaluator.findByXpath(xpath_selectors[i]);
        }
        return _;
    }
}

export function extractor_by_query(selectors: StringIndexTypes<any>){
    return function(resource: Resource){
        // @ts-ignore
        let evaluator = new Evaluator(resource.response);

        let _:StringIndexTypes<any> = {};
        for(let i in selectors){
            _[i] = evaluator.find(selectors[i]);
        }
        return _;
    }
}

export function extractor_by_jsonpath(selectors: StringIndexTypes<any>){
    return function(resource: Resource){
        let evaluator = new Evaluator(resource.response as IResponse);

        let _:StringIndexTypes<any> = {};
        for(let i in selectors){
            _[i] = evaluator.findByJSONPath(selectors[i]);
        }
        return _;
    }
}

export function extractor_for_link(selector:string = "a[href]", patterns: RegExp[] = []): Function{
    return function(resource: Resource){
        let evaluator = new Evaluator(resource.response as IResponse);
        let elements = evaluator.find(selector);
        
        return Array.from(elements as Array<HTMLAnchorElement>).filter( (node: HTMLAnchorElement) => {
            return node.href != "";
        })
        .map( (node: HTMLAnchorElement) => {
            return url.resolve(resource.request.url, node.href);
        })
        .filter( (link: string) => {
            if(patterns.length == 0){
                return true;
            }
            for(let i in patterns){
                let pattern = patterns[i];
                if(link.match(pattern) != null){
                    return true;
                }
            }
            return false;
        });
    };
}

export function matcher_for_url(pattern: RegExp | string | boolean): Matcher{
    return function(resource: Resource){
        if(pattern === true || pattern === false){
            return pattern;
        }
        return resource.request.url.match(pattern) !== null;
    }
}