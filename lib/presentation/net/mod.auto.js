// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function httpEndpointAvailableAction(url1, action, state) {
    const prepareHttpRequest = (url, state)=>{
        const http = new XMLHttpRequest();
        http.open("HEAD", url, true);
        http.setRequestHeader("Content-Type", "text/plain");
        return http;
    };
    const http1 = state?.prepareXMLHttpRequest ? state.prepareXMLHttpRequest(url1, state) : prepareHttpRequest(url1, state);
    http1.onreadystatechange = function(xhrEvent) {
        if (http1.readyState == 4) {
            if (http1.status == 200) {
                action({
                    request: http1,
                    url: url1,
                    xhrEvent,
                    state
                });
            } else {
                if (state?.onInvalidStatus) {
                    state.onInvalidStatus({
                        request: http1,
                        url: url1,
                        xhrEvent,
                        state
                    });
                }
            }
        }
    };
    try {
        http1.send(null);
    } catch (error) {
        if (state?.onError) {
            if (state?.onInvalidStatus) {
                state.onInvalidStatus({
                    request: http1,
                    url: url1,
                    xhrEvent,
                    state,
                    error
                });
            }
        }
    }
}
export { httpEndpointAvailableAction as httpEndpointAvailableAction };
function inspectUrlHttpHeaders(options = {
    inspectURL: null,
    onHeaders: null,
    onHeader: null
}) {
    function parseHttpHeaders(httpHeaders) {
        return httpHeaders.split("\r\n").map((x)=>x.split(/: */, 2)
        ).filter((x)=>x[0]
        ).reduce((ac, x)=>{
            const headerNameAsIs = x[0];
            const headerNameCamelCase = headerNameAsIs.toLowerCase().replace(/([-_][a-z])/g, (group)=>group.toUpperCase().replace('-', '').replace('_', '')
            );
            const headerValueAsIs = x[1];
            let headerValue = undefined;
            try {
                headerValue = JSON.parse(headerValueAsIs);
            } catch  {
                headerValue = headerValueAsIs;
            }
            ac[headerNameAsIs] = headerValue;
            ac[headerNameCamelCase] = headerValue;
            ac.__headerNameAliases[headerNameCamelCase] = headerNameAsIs;
            ac.__headerNameAliases[headerNameAsIs] = headerNameCamelCase;
            return ac;
        }, {
            __headerNameAliases: {}
        });
    }
    const inspectURL = options?.inspectURL || location;
    const xhr = new XMLHttpRequest();
    xhr.open("HEAD", inspectURL);
    xhr.onload = function() {
        const headers = parseHttpHeaders(xhr.getAllResponseHeaders());
        if (options?.onHeaders && typeof options.onHeaders === "function") options.onHeaders(headers, inspectURL);
        if (options?.onHeader) {
            if (typeof options.onHeader !== "object") {
                console.error(`[inspectUrlHttpHeaders] options.onHeader is expected to be an object`);
                return;
            }
            for(const key in options.onHeader){
                const alias = headers.__headerNameAliases[key];
                const handlers = options.onHeader[key];
                const foundHeaderFn = Array.isArray(handlers) ? handlers[0] : handlers;
                const notFoundHeaderFn = Array.isArray(handlers) ? handlers[1] : undefined;
                if (!(key in headers)) {
                    if (typeof notFoundHeaderFn === "function") {
                        notFoundHeaderFn(key, alias, inspectURL);
                    } else if (notFoundHeaderFn) {
                        console.error(`[inspectUrlHttpHeaders] onHeader "${key}" notFoundHeaderFn is not a function`);
                    }
                } else {
                    const value = headers[key];
                    if (typeof foundHeaderFn === "function") {
                        foundHeaderFn(value, key, alias, inspectURL);
                    } else {
                        console.error(`[inspectUrlHttpHeaders] onHeader "${key}" foundHeaderFn is not a function`);
                    }
                }
            }
        }
    };
    xhr.send();
}
export { inspectUrlHttpHeaders as inspectUrlHttpHeaders };