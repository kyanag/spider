const url = require("url");
const cheerio = require("cheerio");


module.exports = {
    "link_extrator": function(app, {request, response}){
        const $ = cheerio.load(response.body);
    
        return $("a[href]").map( (index, node) => {
            return $(node).attr("href");
        });
    }
}