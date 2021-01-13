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
        console.log("abcdefg", request.url);
        const $ = cheerio.load(response.body);
    
        return $("a[href]").map( (index, node) => {
            return $(node).attr("href");
        }).filter( function(link){
            console.warn(arguments)
            //为空的

            //域名不符合的
            return link;
        }).map( link => {
            console.log(link);
            return url.resolve(request.url, link);
        });
    },
}