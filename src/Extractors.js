const url = require("url");
const cheerio = require("cheerio");


module.exports = {
    //xpath抽取器工厂
    xpathExtractorFactory: function(fields){
        return function(app, {request, response}){

        }
    },

    //链接抽取器
    linkExtrator: function(app, {request, response}){
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