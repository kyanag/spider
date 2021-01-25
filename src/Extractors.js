const url = require("url");
const cheerio = require("cheerio");
const HtmlDocument = require("./supports/.js/index.js")

module.exports = {
    //xpath抽取器工厂
    xpath_extractor_factory: function(xpath_selectors){
        return function(app, {request, response}){
            let dom = new HtmlDocument(response);
            //return null;

            let _ = {};
            for(let key in xpath_selectors){
                let xpath_selector = xpath_selectors[key];
                // /**
                //  * @var {js.dom.XPathResult} XPathResult
                //  */
                // let XPathResult = dom.window.document.evaluate(
                //     xpath_selector, 
                //     dom.window.document, 
                //     null,
                //     dom.window.XPathResult.ANY_TYPE
                // )
                // _[key] = xpath_result_value(XPathResult);

                _[key] = dom.findWithXpath(xpath_selector)
                app.stop();
            }
            return _;
        }
    },
    query_extractor_factory: function(selectors){
        return function(app, {request, response}){
            let $ = cheerio.load(response.body);

            console.warn("now:", $);
            //$.document.evaluate("")

            let _ = {};
            for(let key in selectors){
                let selector = selectors[key]
                _[key] = $(selector).html();
            }
            return _;
        }
    },

    //链接抽取器工厂
    link_extrator_factory: function({patterns = [], }){
        return function(app, {request, response}){
            const $ = cheerio.load(response.body);
            
            return $("a[href]").map( (index, node) => {
                return $(node).attr("href");
            })
            .toArray()
            .filter( function(link){
                return link;
            })
            .map( (link) => {
                return url.resolve(request.url, link);
            }).filter( link => {
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

    //链接抽取器
    link_extrator: function(app, {request, response}){
        console.log("\t链接抽取:", request.url);
        const $ = cheerio.load(response.body);
        
        return $("a[href]").map( (index, node) => {
            return $(node).attr("href");
        })
        .toArray()
        .filter( function(link){
            return link;
        })
        .map( (link) => {
            return url.resolve(request.url, link);
        });
    },
}