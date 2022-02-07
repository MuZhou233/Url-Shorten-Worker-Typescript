"use strict";
const config = {
    token: "url-shorten-worker",
    // Token is required when create new short link, set to empty will
    // allow anyone to create short link.
    no_ref: "off",
    // Control the HTTP referrer header, if you want to create an anonymous
    // link that will hide the HTTP Referer header, please set to `on`.
    allow_cors: true,
    // Allow Cross-origin resource sharing for API requests.
    url_len: 6,
    // Control length of short link
    force_http: true,
    // Check if the shorted link is an legal http(s) url
};
function isConfigInvalid() {
    return (typeof config.token != "string" ||
        typeof config.no_ref != "string" ||
        typeof config.allow_cors != "boolean" ||
        typeof config.url_len != "number" ||
        typeof config.force_http != "boolean");
}
const html404 = `
<!DOCTYPE html>
<body>
    <h1>404 Not Found.</h1>
    <p>The url you visit is not found.</p>
</body>
`;
const html_no_ref = `
<!DOCTYPE html>
<html>
<head>
    <title>Url-Shorten-Worker</title>
    <meta http-equiv="Refresh" content="1; url={Replace}" />
    <meta name="referrer" content="no-referrer" />
</head>
<body>
    <p>Redirecting..<br /><a href="{Replace}">{Replace}</a></p>
    <script type="text/javascript">
        setTimeout('window.location.replace( "{Replace}" + window.location.hash );', 0 )
    </script>
</body>
</html>
`;
async function defaultPOSTHandler(request) {
    let req = await request.json();
    if (!req.token || !isValidToken(req.token)) {
        return genResponse({ key: null, status: 403, statusText: "Permission denied" });
    }
    if (!req.url) {
        return genResponse({ key: null, status: 400, statusText: "Url reqired" });
    }
    else if (!isValidURL(req.url)) {
        return genResponse({ key: null, status: 403, statusText: "Url illegal" });
    }
    let key;
    if (req.key) {
        key = req.key;
    }
    else {
        let is_exist = await genNewKey();
        if (is_exist)
            key = is_exist;
        else
            return genResponse({ key: null, status: 500, statusText: "Failed find unused key" });
    }
    let stat = await LINKS.put(key, req.url);
    if (typeof (stat) == "undefined") {
        return genResponse({ key, status: 200, statusText: "" });
    }
    else {
        return genResponse({ key, status: 500, statusText: "Reach the KV write limitation" });
    }
}
async function defaultGETHandler(request) {
    const requestURL = new URL(request.url);
    const path = requestURL.pathname.split("/")[1];
    if (path) {
        const location = await LINKS.get(path);
        if (location) {
            if (config.no_ref == "on") {
                return genNoRefResponse(location);
            }
            else {
                return Response.redirect(location, 302);
            }
        }
    }
    return gen404Response();
}
function genResponse(resp) {
    let headers = {
        "content-type": "text/html;charset=UTF-8",
    };
    if (config.allow_cors) {
        headers = {
            "content-type": "text/html;charset=UTF-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
        };
    }
    let body;
    if (resp.key) {
        body = `{
            "key": "/${resp.key}"
        }`;
    }
    else {
        body = ``;
    }
    return new Response(body, {
        headers,
        status: resp.status,
        statusText: resp.statusText,
    });
}
function gen404Response() {
    return new Response(html404, {
        headers: {
            "content-type": "text/html;charset=UTF-8",
        },
        status: 404
    });
}
function genNoRefResponse(location) {
    let no_ref = html_no_ref;
    no_ref = no_ref.replace(/{Replace}/gm, location);
    return new Response(no_ref, {
        headers: {
            "content-type": "text/html;charset=UTF-8",
        },
    });
}
async function handleRequest(request) {
    if (isConfigInvalid())
        return gen404Response();
    if (request.method === "POST") {
        return defaultPOSTHandler(request);
    }
    if (request.method === "GET") {
        return defaultGETHandler(request);
    }
    return gen404Response();
}
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});
function isValidURL(url) {
    let str = url;
    let Expression = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    let objExp = new RegExp(Expression);
    return config.force_http && objExp.test(str);
}
function isValidToken(token) {
    return token.length == 0 || token === config.token;
}
async function genNewKey() {
    for (let i = 0; i < 30; i++) {
        let key = randomString();
        if (await LINKS.get(key) == null) {
            return key;
        }
    }
    return null;
}
function randomString() {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
    let result = '';
    for (let i = 0; i < config.url_len; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
