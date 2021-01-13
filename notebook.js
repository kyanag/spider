const cheerio = require("cheerio");

let $ = cheerio.load("<html><head><title>dafasdfas</title></head><body></body></html>");

console.log($("title").toString())