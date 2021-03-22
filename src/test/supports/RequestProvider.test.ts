import assert from "assert";
import {FetchRequester} from "../../lib/supports/RequestProvider"

describe('RequestProvider', function() {
    it('@RequestByFetch', async function() {
        let requester = new FetchRequester();

        let irequest: IRequest = {
            url: "http://wx3.sinaimg.cn/large/0089jzyPgy1gos0alobsjj30u01401kx.jpg",
        }
        requester.fetch(irequest).then( response => {
            console.log("raw:", response.raw);
            console.log("body:", response.body);
        }).catch( error => {
            console.log("111:", error);
        });
        assert.ok(true);
    });
});


