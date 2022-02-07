const config = {
    token: "url-shorten-worker",
    // Token is required when create new short link, set to empty will
    // allow anyone to create short link.
    no_ref: "off",
    // Control the HTTP referrer header, if you want to create an anonymous
    // link that will hide the HTTP Referer header, please set to `on`.
    allow_cors: true, 
    // Allow Cross-origin resource sharing for API requests.
    url_len : 6,
    // Control length of short link
    force_http: true,
    // Check if the shorted link is an legal http(s) url
}

function isConfigInvalid() {
    return (
        typeof config.token != "string" ||
        typeof config.no_ref != "string" ||
        typeof config.allow_cors != "boolean" ||
        typeof config.url_len != "number" ||
        typeof config.force_http != "boolean"
    )
}