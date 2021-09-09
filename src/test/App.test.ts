import assert from "assert";
import {App} from "../lib/App";
import {create_resource_from_url} from "../lib/functions";

describe('App:Function', function(){
  
});

describe('App', function() {
    describe('@fetch', function() {
      let app = new App({
        "id": "test",
        'nums': 1,
        "max_retry_num": 1,
        "interval": 1,
        'timeout': 10,
        'listeners': {},
        'extractors': new Array<Extractor>(),
      });

      // [1000, 2000, 5000, 10000].forEach(timeout => {
      //   it(`timeout-${timeout}`, function() {
      //     let resource:Resource = create_resource_from_url("https://google.com");  
      //     let time = (new Date()).getTime();

      //     app.fetch(resource, timeout).then( (resource: Resource) => {
      //         let nowtime = (new Date()).getTime();

      //         let timediff = (nowtime - time) / timeout;
      //         let ratio = timediff >= 0.9 && timediff <= 1.1
      //         //console.log(`start:${time/1000}; end:${nowtime/1000}; ${timediff}`, timediff >= 1 && timediff <= 1.1);

      //         assert.ok(ratio);
      //     })
      //   });
      // });
    });
});


