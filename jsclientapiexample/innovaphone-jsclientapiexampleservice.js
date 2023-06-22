new JsonApi("LookupApi").onconnected(function(conn) {
    if (conn.app === "innovaphone-jsclientapiexample") {
        conn.onmessage(function(msg) {
            var obj = JSON.parse(msg);
            if (obj.mt === "NumberLookup") {
                setupHttpRequest(obj.e164, function (text) { // callback function definition for HTTP result
                    conn.send(JSON.stringify({ api: "LookupApi", mt: "NumberLookupResult", name: text, src: obj.src }));
                });
            }
        });
    }
});


function setupHttpRequest(e164, callback) {
    log("prepare HTTP request for " + e164);
    var text = "";
    HttpClient.request("GET", baseUrl + "phonenumber/" + e164) // adjust URL according the REST API if needed
        .onrecv(function (req, data, last) {
            text += new TextDecoder("utf-8").decode(data);
            if (!last) req.recv();
        }, 2048)
        .oncomplete(function (req, success) {
            if (success) callback(text);
            else log("GET ERROR");
        });
}


// simulate external REST API with local Webserver Library
var baseUrl = WebServer.url;
log("url: " + baseUrl);

WebServer.onurlchanged(function (newUrl) {
    baseUrl = newUrl;
    log("url: " + baseUrl);
});

WebServer.onrequest("phonenumber", function (req) {
    if (req.method === "GET") {
        var resolvedName = "Name Not Found";

        // just for testing
        var testString = "/" + "+497031730090";
        log("RelativeURI: " + req.relativeUri);
        log("Test_String: " + testString);
        if (req.relativeUri === testString) {
            resolvedName = "innovaphone AG";
        }

        req.responseContentType("txt")
            .sendResponse()
            .onsend(function (req) {
                req.send(new TextEncoder("utf-8").encode(resolvedName), true);
            });
    }
    else {
        req.cancel();
    }
});