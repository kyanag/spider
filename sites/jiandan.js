const { link_extrator } = require("../src/Extractors")

export default {
    "entry": [
        "https://www.npmjs.com/",
    ],
    "maxRetryNum": 5,
    "domains": [
        'www.npmjs.com'
    ],
    "routeGroup": [
        {
            regex: "",
            extractor: ["links"],
        },
    ],
    
}