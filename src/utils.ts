function isValidURL(url: string) {
    let str = url;
    let Expression = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    let objExp = new RegExp(Expression);
    return config.force_http && objExp.test(str)
}

function isValidToken(token: string) {
    return token.length == 0 || token === config.token
}

async function genNewKey() {
    for(let i = 0; i < 30; i++) {
        let key = randomString()
        if (await LINKS.get(key) == null) {
            return key
        }
    }
    return null
}

function randomString() {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
    let result = '';
    for (let i = 0; i < config.url_len; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}