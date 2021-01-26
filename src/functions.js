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



module.exports = {
    download_file,
    xpath_result_value
};