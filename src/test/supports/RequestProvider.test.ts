import assert from "assert";
import {FetchRequester} from "../../lib/supports/RequestProvider"
import { get_class } from "../function";
const db = require("mime-db");


describe('RequestProvider', function() {
    it('@RequestByFetch', async function() {
        let requester = new FetchRequester();

        let irequest: IRequest = {
            url: "https://www.zhihu.com/question/400286737/answer/1272247244",
        }
        requester.fetch(irequest).then( response => {
            //console.log("headers:", response.headers);
            console.log("", get_class(response.body));
        }).catch( error => {
            console.log("111:", error);
        });
        assert.ok(true);
    });
});


