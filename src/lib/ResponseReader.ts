import jsdom from "jsdom";
import jmespath from "jmespath";

let {
    Document,
    XPathResult,
    Attr,
    Text,
    HTMLAnchorElement,
    HTMLImageElement,
    HTMLElement,
} = new jsdom.JSDOM().window;

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

class ResponseReader{

    private _response: FetchResponse

    private _text?: string
    private _document?: Document

    constructor(_response: FetchResponse){
        this._response = _response;
    }

    async getText(): Promise<string>{
        if(this._text){
            return this._text;
        }
        return this._response.text().then( text => {
            this._text = text;
            return text;
        });
    }

    async getDocument(){
        if(!this._document){
            let text = await this.getText();
            this._document = new jsdom.JSDOM(text).window.document;
        }
        return this._document;
    }

    async find(selector: string): Promise<Array<Element>>{
        let document = await this.getDocument();
        return Array.from(
            document.querySelectorAll(selector)
        );
    }

    async findByXpath(xpath_selector: string){
        let document = await this.getDocument();
        let xpathResult = document.evaluate(
            xpath_selector, //"//title//text()", 
            document, 
            null,
            XPathResult.ANY_TYPE
        );
        return xpathResultValue(xpathResult);
    }

    async findByJsonPath(json_path: string){
        let text = await this.getText();
        return jmespath.search(JSON.parse(text), json_path);
    }
}

class HtmlEvaluator{
    html: string
    private window: jsdom.DOMWindow

    constructor(html: string){
        this.html = html;
        this.window = new jsdom.JSDOM(this.html).window;
    }

    getDocument(): Document{
        return this.window.document;
    }

    xpathResultValue(xpath_result: XPathResult){
        try{
            switch(xpath_result.resultType){
                case xpath_result.BOOLEAN_TYPE:
                    return xpath_result.booleanValue;
                case xpath_result.NUMBER_TYPE:
                    return xpath_result.numberValue;
                case xpath_result.STRING_TYPE:
                    return xpath_result.stringValue;
                case xpath_result.FIRST_ORDERED_NODE_TYPE:
                    return xpath_result.singleNodeValue;
                case xpath_result.ORDERED_NODE_SNAPSHOT_TYPE:
                case xpath_result.UNORDERED_NODE_ITERATOR_TYPE:
                default:
                    let _ = [];
                    let node;
                    while(node = xpath_result.iterateNext()){
                        let value = this.getNodeValue(node as HTMLElement);
                        _.push(value); 
                    }
                    return _;
            }
        }catch(err){
            throw err;
        }
    }

    /**
     * @param {Node} node 
     */
    getNodeValue(node: Element){
        if(node instanceof this.window.Attr){
            return node.value;
        }else if(node instanceof this.window.Text){
            return node.wholeText;
        }else if(node instanceof this.window.HTMLAnchorElement){
            return node.href;
        }else if(node instanceof this.window.HTMLImageElement){
            return node.src;
        }else if(node instanceof this.window.HTMLElement){
            return node.innerText;
        }else{
            return node.textContent;
        }
    }

    findXpath(xpath_selector: string){
        let xpathResult = this.getDocument().evaluate(
            xpath_selector, //"//title//text()", 
            this.getDocument(), 
            null,
            this.window.XPathResult.ANY_TYPE
        );
        return this.xpathResultValue(xpathResult);
    }

    // findJSONPath(jsonpath: string){
    //     let _ = jmespath.search(this.getDocument());
    //     if(multi === false && !_ instanceof Array){
    //         return _[0];
    //     }
    //     return _;
    // }

    find(selector: string): Array<Element>{
        return Array.from(
            this.getDocument().querySelectorAll(selector)
        );
    }
}

export = ResponseReader;