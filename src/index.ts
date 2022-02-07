async function handleRequest(request: Request) {
    if (isConfigInvalid())
        return gen404Response()
    
    if (request.method === "POST") {
        return defaultPOSTHandler(request)
    }
    if (request.method === "GET") {
        return defaultGETHandler(request)
    }

    return gen404Response()
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})