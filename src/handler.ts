type Req = {
    token: string | null,
    url: string | null,
    key: string | null,
}

type Resp = {
    key: string | null,
    status: number,
    statusText: string,
}

async function defaultPOSTHandler(request: Request) {
    let req = await request.json() as Req

    if (!req.token || !isValidToken(req.token)) {
        return genResponse({key: null, status: 403, statusText: "Permission denied"})
    }
    if (!req.url) {
        return genResponse({key: null, status: 400, statusText:"Url reqired"})
    } else if (!isValidURL(req.url)) {
        return genResponse({key: null, status: 403, statusText: "Url illegal"})
    }
    
    let key: string
    if (req.key) {
        key = req.key
    } else {
        let is_exist = await genNewKey()
        if (is_exist)
            key = is_exist
        else
            return genResponse({key: null, status: 500, statusText: "Failed find unused key"})
    }
    let stat = await LINKS.put(key, req.url)

    if (typeof (stat) == "undefined") {
        return genResponse({key, status: 200, statusText: ""})
    } else {
        return genResponse({key, status: 500, statusText: "Reach the KV write limitation"})
    }
}

async function defaultGETHandler(request: Request) {
    const requestURL = new URL(request.url)
    const path = requestURL.pathname.split("/")[1]
    if (path) {
        const location = await LINKS.get(path)
    
        if (location) {
            if (config.no_ref == "on") {
                return genNoRefResponse(location)
            } else {
                return Response.redirect(location, 302)
            }
        }
    }

    return gen404Response()
}

function genResponse(resp: Resp) {
    let headers: Record<string, string> = {
        "content-type": "text/html;charset=UTF-8",
    }
    
    if (config.allow_cors) {
        headers = {
            "content-type": "text/html;charset=UTF-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
        }
    }

    let body: string
    if (resp.key) {
        body = `{
            "key": "/${resp.key}"
        }`
    } else {
        body = ``
    }
    return new Response(body,{
        headers,
        status: resp.status,
        statusText: resp.statusText,
    })
}

function gen404Response() {
    return new Response(html404, {
        headers: {
            "content-type": "text/html;charset=UTF-8",
        },
        status: 404
    })
}

function genNoRefResponse(location: string) {
    let no_ref = html_no_ref
    no_ref = no_ref.replace(/{Replace}/gm, location)
    return new Response(no_ref, {
        headers: {
            "content-type": "text/html;charset=UTF-8",
        },
    })
}