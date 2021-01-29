const jsdom = require("jsdom");

class HtmlEvaluator{
    constructor(response){
        this.response = response;
        this.document = null;

        //this.types = {};
    }

    _getDom(){
        if(this.document === null){
            let window = new jsdom.JSDOM(this.response.body).window;
            this.document = window.document;
            
            this.types = window;
        }
        return this.document;
    }

    xpathResultValue(xpath_result, multi = false){
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
                        let value = this.getNodeValue(node);
                        //console.log(node.constructor, jsdom.JSDOM);
                        if(multi === false){
                            return value;
                        }
                        _.push(value); 
                    }
                    return _;
            }
        }catch(err){
            throw err;
            return undefined;
        }
    }

    /**
     * @param {Node} node 
     */
    getNodeValue(node){
        let types = this.types;

        switch(node.constructor){
            case types.Attr:
                return node.value;
            case types.Text:
                return node.wholeText;
            case types.HTMLAnchorElement:
                return node.href;
            case types.HTMLImageElement:
                return node.src;
            default:
                return node.innerText;
        }
    }

    findXpath(xpath_selector, multi = false){
        let xpathResult = this._getDom().evaluate(
            xpath_selector, //"//title//text()", 
            this._getDom(), 
            null,
            this.types.XPathResult.ANY_TYPE
        );
        return this.xpathResultValue(xpathResult, multi);
    }

    *find(selector, multi = false){
        if(multi){
            let _ = [];
            let _nodeList = this._getDom().querySelectorAll(selector);
            for(var node of _nodeList){
                yield this.getNodeValue(node);
            }
        }else{
            let node = this._getDom().querySelector(selector);
            if(node){
                return this.getNodeValue(node);
            }
            return null;
        }
    }
}

module.exports = HtmlEvaluator;