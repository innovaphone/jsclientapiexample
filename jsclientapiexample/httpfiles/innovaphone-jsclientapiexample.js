
/// <reference path="../../web1/lib1/innovaphone.lib1.js" />
/// <reference path="../../web1/appwebsocket/innovaphone.appwebsocket.Connection.js" />
/// <reference path="../../web1/ui1.lib/innovaphone.ui1.lib.js" />

var innovaphone = innovaphone || {};
innovaphone.jsclientapiexample = innovaphone.jsclientapiexample || function (start, args) {
    this.createNode("body");
    var that = this;

    var colorSchemes = {
        dark: {
            "--bg": "#191919",
            "--button": "#303030",
            "--text-standard": "#f2f5f6",
        },
        light: {
            "--bg": "white",
            "--button": "#e0e0e0",
            "--text-standard": "#4a4a49",
        }
    };
    var schemes = new innovaphone.ui1.CssVariables(colorSchemes, start.scheme);
    start.onschemechanged.attach(function () { schemes.activate(start.scheme) });

    var texts = new innovaphone.lib1.Languages(innovaphone.jsclientapiexampleTexts, start.lang);
    start.onlangchanged.attach(function () { texts.activate(start.lang) });

    var app = new innovaphone.appwebsocket.Connection(start.url, start.name);
    app.checkBuild = true;
    app.onconnected = appConnected;
    app.onmessage = appMessage;

    function appConnected(domain, user, dn, appdomain) {
        // send a test message to backend when the app is connected
        var test = {
            "mt": "Lookup",
            "lookup": "000497031730090",
            "prefixIntl": "000",
            "prefixNtl": "00",
            "prefixExt": "0",
            "country": "49",
            "area": "7031",
            "subscriber": "73009"
        };
        app.send({ api: "LookupApi", mt: "NumberLookup", e164: getNormalizedNumber(test) });
    }

    function appMessage(obj) {
        if (obj.api === "LookupApi" && obj.mt === "NumberLookupResult") {
            console.log("NumberLookupResult: name=" + obj.name); // just logging resposes from app service
        }
    }

    var phonelookupApi = start.provideApi("com.innovaphone.phonelookup");

    phonelookupApi.onmessage.attach(function (sender, phonelookupApiRequest) {
        // usually the requests should be queued and processed
        // one by one to avoid heavy load, also a local cache can be created
        // we forward them directly to app service to keep it simple

        if (phonelookupApiRequest.msg.mt === "Lookup") {
            app.sendSrc(
                { api: "LookupApi", mt: "NumberLookup", e164: getNormalizedNumber(phonelookupApiRequest.msg) },
                function (resultMsg) { // this function is called when response to sendSrc arrives 
                    var response = { mt: "LookupInfo", dn: undefined, link: undefined, contact: {}, photourl: undefined, adjust: true }; //adjust number by a trunk prefix
                    response.dn = resultMsg.name;
                    sender.send(response, phonelookupApiRequest.consumer, phonelookupApiRequest.src); // consumer and src must be returned to sender
                    sender.send({ mt: "LookupResult" }, phonelookupApiRequest.consumer, phonelookupApiRequest.src); // finishing LookupResult message
                }
            );
        }
    });

    // get phone number in international number format 
    function getNormalizedNumber(obj) {
        var num = obj.lookup;
        var e164 = undefined;

        if (num.startsWith(obj.prefixIntl)) {
            e164 = "+" + num.slice(obj.prefixIntl.length);
        } else if (num.startsWith(obj.prefixNtl)) {
            e164 = "+" + obj.country + num.slice(obj.prefixNtl.length);
        } else if (num.startsWith(obj.prefixExt)) {
            e164 = "+" + obj.country + obj.area + num.slice(obj.prefixExt.length);
        } else {
            e164 = num;
        }
        return e164;
    }
};

innovaphone.jsclientapiexample.prototype = innovaphone.ui1.nodePrototype;
