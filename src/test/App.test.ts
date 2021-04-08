import assert from "assert";
import {App} from "../lib/App";
import {create_resource_from_url} from "../lib/functions";

describe('App:Function', function(){
  let One = function(){
    return 1;
  };
  let OneAndTwo = One.then( i => i + 2);
  let OneTwoThree = OneAndTwo.then( i => i+ 3);

  it("@then - 3", function(){
    OneAndTwo.then( (value: number) => {
      assert.ok(value == 3);
    });
  });
  it("@then - 6", function(){
    OneTwoThree.then( (value: number) => {
      assert.ok(value == 6);
    });
  });
});

describe('App', function() {
    describe('@fetch', function() {
      let app = new App({
        "id": "test",
        "queue": new Array<Resource>(),
        "max_retry_num": 1,
        "interval": 1,
        'timeout': 10,
        'listeners': {},
        'extractors': new Array<Handler>(),
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


