import assert from "assert";
import {BasicClient} from "../../lib/supports/BasicClient"
import { get_class } from "../function";
const db = require("mime-db");


describe('RequestProvider', function() {
    it('@RequestByFetch', async function() {
        let requester = new BasicClient();

        let irequest: IRequest = {
            method:"get",
            url: "https://www.zhihu.com/question/400286737/answer/1272247244",
        }
        requester.fetch(irequest).then( response => {
            //console.log("headers:", response.headers);
            //console.log("", get_class(response.body));
        }).catch( error => {
            //console.log("111:", error);
        });
        assert.ok(true);
    });
});


