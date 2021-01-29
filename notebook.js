const cheerio = require("cheerio");

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