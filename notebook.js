const cheerio = require("cheerio");


class Test{

    *t(){
        yield 1;
    }
}

let a = new Test();

let t = a.t();
for(let i in t){
    console.log(i);
}