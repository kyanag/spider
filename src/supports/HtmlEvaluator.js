const jsdom = require("jsdom");
const jmespath = require("jmespath");

class HtmlEvaluator{
    constructor(response){
        this.response = response;

        //this.types = {};
    }

    getDoucment(){
        if(this.response._window === null){
            //this.response._window = new jsdom.JSDOM(this.response.body).window;
            this.types = new jsdom.JSDOM(this.response.body).window;
        }
        return this.types.document;
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
        let xpathResult = this.getDoucment().evaluate(
            xpath_selector, //"//title//text()", 
            this.getDoucment(), 
            null,
            this.types.XPathResult.ANY_TYPE
        );
        return this.xpathResultValue(xpathResult, multi);
    }

    findJSONPath(jsonpath, multi = false){
        let _ = jmespath.search(this.getDoucment().toJSON());
        if(multi === false && _.constructor == Array){
            return _[0];
        }
        return _;
    }

    *find(selector, multi = false){
        if(multi){
            let _ = [];
            let _nodeList = this.getDoucment().querySelectorAll(selector);
            for(var node of _nodeList){
                yield this.getNodeValue(node);
            }
        }else{
            let node = this.getDoucment().querySelector(selector);
            if(node){
                return this.getNodeValue(node);
            }
            return null;
        }
    }
}

module.exports = HtmlEvaluator;