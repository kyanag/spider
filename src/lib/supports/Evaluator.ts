import jsdom from "jsdom";
import jmespath from "jmespath";

let getNodeValue = function(node: Element){
   if(node instanceof Attr){
       return node.value;
   }else if(node instanceof Text){
       return node.wholeText;
   }else if(node instanceof HTMLAnchorElement){
       return node.href;
   }else if(node instanceof HTMLImageElement){
       return node.src;
   }else if(node instanceof HTMLElement){
       return node.innerText;
   }else{
       return node.textContent;
   }
}

let xpathResultValue = function(xpath_result: XPathResult){
    try{
        switch(xpath_result.resultType){
            case XPathResult.BOOLEAN_TYPE:
                return xpath_result.booleanValue;
            case XPathResult.NUMBER_TYPE:
                return xpath_result.numberValue;
            case XPathResult.STRING_TYPE:
                return xpath_result.stringValue;
            case XPathResult.FIRST_ORDERED_NODE_TYPE:
                return xpath_result.singleNodeValue;
            case XPathResult.ORDERED_NODE_SNAPSHOT_TYPE:
            case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
            default:
                let _ = [];
                let node;
                while(node = xpath_result.iterateNext()){
                    let value = getNodeValue(node as HTMLElement);
                    _.push(value); 
                }
                return _;
        }
    }catch(err){
        throw err;
    }
}

class Extractor{

    private _response: IResponse;
    private _window?: jsdom.DOMWindow

    constructor(response: IResponse){
        this._response = response;
    }

    getWindow(): jsdom.DOMWindow{
        if(this._window === undefined){
            this._window = new jsdom.JSDOM(this._response.text).window;
        }
        return this._window;
    }

    getDocument(): Document{
        return this.getWindow().document;
    }

    findByXpath(xpath_selector: string){
        let xpathResult = this.getDocument().evaluate(
            xpath_selector, //"//title//text()", 
            this.getDocument(), 
            null,
            XPathResult.ANY_TYPE
        );
        return xpathResultValue(xpathResult);
    }

    findByJSONPath(jsonpath: string){
        let json = JSON.parse(this._response?.text ?? "");
        return jmespath.search(json, jsonpath);
    }

    find(selector: string): Array<Element>{
        return Array.from(
            this.getDocument().querySelectorAll(selector)
        );
    }
}

export = Extractor;