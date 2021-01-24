const cheerio = require("cheerio");


let regex = /article\-(\d*).*\.html/g;

let url = "https://www.2meinv.com/article-2903.html";

console.log(url.match(regex));