const config = {
    token: "url-shorten-worker",
    // Token is required when create new short link, set to empty will
    // allow anyone to create short link.
    no_ref: "off",
    // Control the HTTP referrer header, if you want to create an anonymous
    // link that will hide the HTTP Referer header, please set to `on`.
    theme: "", 
    // Homepage theme, use the empty value for default theme. To use urlcool 
    // theme, please fill with `theme/urlcool`.
    cors: "on", 
    // Allow Cross-origin resource sharing for API requests.
    url_len : 6,
    // Control length of short link
    force_http: true,
    // Check if the shorted link is an legal http(s) url
}

let response_header: Record<string, string> = {
    "content-type": "text/html;charset=UTF-8",
}

if (config.cors == "on") {
    response_header = {
        "content-type": "text/html;charset=UTF-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
    }
}

async function checkURL(url: string) {
    let str = url;
    let Expression = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    let objExp = new RegExp(Expression);
    return config.force_http && objExp.test(str)
}

async function checkToken(token: string) {
    return token.length == 0 || token === config.token
}

async function saveURL(url: string) {
    let random_key = await randomString()
    let is_exist = await LINKS.get(random_key)
    console.log(is_exist)
    if (is_exist == null)
        return await LINKS.put(random_key, url), random_key
    else
        saveURL(url)
}

async function handleRequest(request: Request) {
    console.log(request)
    if (request.method === "POST") {
        type Req = {
            url: string,
            token: string,
        }
        let req = await request.json() as Req

        if (!checkToken(req.token)) {
            return new Response(`{"status":403,"key":": Error: Permission denied."}`, {
                headers: response_header,
            })
        }
        if (!await checkURL(req["url"])) {
            return new Response(`{"status":403,"key":": Error: Url illegal."}`, {
                headers: response_header,
            })
        }
        let stat, random_key = await saveURL(req["url"])
        console.log(stat)
        if (typeof (stat) == "undefined") {
            return new Response(`{"status":200,"key":"/` + random_key + `"}`, {
                headers: response_header,
            })
        } else {
            return new Response(`{"status":500,"key":": Error: Reach the KV write limitation."}`, {
                headers: response_header,
            })
        }
    }
    
    if (request.method === "GET") {
        const requestURL = new URL(request.url)
        const path = requestURL.pathname.split("/")[1]
        console.log(path)
        if (path) {
            const value = await LINKS.get(path)
            console.log(value)
        
            const location = value
            if (location) {
                if (config.no_ref == "on") {
                    let no_ref = html_no_ref
                    no_ref = no_ref.replace(/{Replace}/gm, location)
                    return new Response(no_ref, {
                        headers: {
                            "content-type": "text/html;charset=UTF-8",
                        },
                    })
                } else {
                    return Response.redirect(location, 302)
                }
        
            }
        }
    }
    // If request not in kv, return 404
    return new Response(html404, {
        headers: {
            "content-type": "text/html;charset=UTF-8",
        },
        status: 404
    })
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function randomString() {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
    let result = '';
    for (let i = 0; i < config.url_len; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const html404 = `
<!DOCTYPE html>
<body>
    <h1>404 Not Found.</h1>
    <p>The url you visit is not found.</p>
</body>
`

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
`