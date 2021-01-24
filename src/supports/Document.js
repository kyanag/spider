const jsdom = require("jsdom");
const cheerio = require("cheerio");

class HtmlDocument{

    constructor(response){
        this.response = response;
        this._dom = null;
    }

    _getDom(){
        if(this._dom === null){
            this._dom = new jsdom.JSDOM(response.body);
            let dom = this._dom;
            console.log(dom.window.Text)
        }
        return this._dom;
    }

    xpathResultValue(xpath_result, multi = false){
        let dom = this._dom;

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
                    while(node = xpath_result.iterateNext()){
                        let value;
                        switch(node.constructor){
                            case dom.window.Text:
                                value = node.wholeText;
                                break;
                            case dom.window.Attr:
                                value = node.value;
                                break;
                            default:
                                value = node.value;    
                        }
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

    findWithXpath(xpath_selector, multi = false){
        let xpathResult = this._dom.window.document.evaluate(
            xpath_selector, //"//title//text()", 
            this._dom.window.document, 
            null,
            this._dom.window.XPathResult.ANY_TYPE
        );
        return this.xpathResultValue(xpathResult, multi);
    }

    find(selector, multi = false){
        cheerio.load(response.body);
    }
}

module.exports = HtmlDocument;