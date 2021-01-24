const request = require('request');
const fs = require('fs');
/*
* url 网络文件地址
* filename 文件名
* callback 回调函数
*/
function download_file(uri, filename, callback){
    var stream = fs.createWriteStream(filename);
    request(uri).pipe(stream).on('close', callback); 
}

function xpath_result_value(xpath_result, multi = false){
    try{
        switch(xpath_result.resultType){
            case xpath_result.BOOLEAN_TYPE:
                return xpath_result.booleanValue;
            case xpath_result.NUMBER_TYPE:
                return xpath_result.numberValue;
            case xpath_result.STRING_TYPE:
                return xpath_result.stringValue;
            case xpath_result.FIRST_ORDERED_NODE_TYPE:
                return xpath_result.singleNodeValue;
            case xpath_result.ORDERED_NODE_SNAPSHOT_TYPE:
            case xpath_result.UNORDERED_NODE_ITERATOR_TYPE:
            default:
                let _ = [];
                while(node = xpath_result.iterateNext()){
                    let value;
                    switch(node.constructor){
                        case DomType.Text:
                            value = node.wholeText;
                            break;
                        default:
                            value = node.value;    
                    }
                    //console.log(node.constructor, jsdom.JSDOM);
                    if(multi === false){
                        return value;
                    }
                    _.push(value); 
                }
                return _;
        }
    }catch(err){
        throw err;
        return undefined;
    }
}



module.exports = {
    download_file,
    xpath_result_value
};