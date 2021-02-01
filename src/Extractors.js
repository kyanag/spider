const url = require("url");
const cheerio = require("cheerio");
const HtmlEvaluator = require("./supports/HtmlEvaluator.js")

module.exports = {
    //xpath抽取器工厂
    xpath_extractor_factory: function(xpath_selectors){
        return function({request, response}){
            let evaluator = new HtmlEvaluator(response);
            let _ = {};
            for(let key in xpath_selectors){
                let args = xpath_selectors[key];
                if(!args instanceof Array){
                    args = [args];
                }
                _[key] = evaluator.findXpath(...args);
            }
            return _;
        }
    },
    query_extractor_factory: function(selectors){
        return function({request, response}){
            let evaluator = new HtmlEvaluator(response);

            let _ = {};
            for(let key in selectors){
                let args = selectors[key];
                if(!args instanceof Array){
                    args = [args];
                }
                _[key] = evaluator.find(...args);
            }
            return _;
        }
    },

    json_extractor_factory: function({
        patterns: {}
    }){
        return function({request, response}){
            //TODO
        }
    },

    //链接抽取器工厂
    link_extrator_factory: function({
        selector = "a[href]",
        patterns = [], 
    }){
        return function({request, response}){
            let evaluator = new HtmlEvaluator(response);
            
            return Array.from(
                evaluator.find(selector, true)
            )
            .filter( function(node){
                return node.href != "";
            })
            .map( node => {
                return url.resolve(request.url, node.href);
            })
            .filter( link => {
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
    },
}