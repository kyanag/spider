const request = require("request");
const fs = require("fs");
const path = require("path");


console.log(path.resolve("./storage/jiandan", "image.png"));

return 1;



let url = "https://pic2.zhimg.com/80/v2-1c40b94dc8bb1984249801565feb0379_720w.jpg";
const _ = request(url, (error, response, body) => {
    console.log("fetched!");
    let filename = './storage/doodle.png';
    _.pipe(fs.createWriteStream(filename));
    console.log("file: exists?", fs.existsSync(filename));

    console.log(_.constructor);

    setTimeout(function(){
        //fs.unlinkSync(filename);
    }, 1000)
});

return;
Function.prototype.applyDecorator = function(func){
    let nowFunc = this;
    return function(...args){
        return func(nowFunc.call(this, ...args));
    }
}

let add = function(one, two){
    let base = this.base || 0;
    return one + two + base;
}

let addWith5 = add.applyDecorator(function(result){
    return result + 5;
});

let addWith5and7 = addWith5.applyDecorator(function(result){
    return result + 7;
});

console.log(addWith5);

console.log("one(1) + two(2) + base(0) + 5 = ", addWith5(1, 2));

let obj = {base: 1};
console.log(`one(1) + two(2) + base(${obj.base}) + 5 = `, addWith5.call({base: 1}, 1, 2));

console.log(`one(1) + two(2) + base(${obj.base}) + 5 + 7 = `, addWith5and7.call({base: 1}, 1, 2));