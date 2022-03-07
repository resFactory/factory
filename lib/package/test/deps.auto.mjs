// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

class EventEmitter {
    _events_ = new Map();
    on(event, listener) {
        if (!this._events_.has(event)) this._events_.set(event, new Set());
        this._events_.get(event).add(listener);
        return this;
    }
    once(event, listener) {
        const l = listener;
        l.__once__ = true;
        return this.on(event, l);
    }
    off(event, listener) {
        if ((event === undefined || event === null) && listener) throw new Error("Why is there a listener defined here?");
        else if ((event === undefined || event === null) && !listener) this._events_.clear();
        else if (event && !listener) this._events_.delete(event);
        else if (event && listener && this._events_.has(event)) {
            const _ = this._events_.get(event);
            _.delete(listener);
            if (_.size === 0) this._events_.delete(event);
        } else ;
        return this;
    }
    emitSync(event, ...args) {
        if (!this._events_.has(event)) return this;
        const _ = this._events_.get(event);
        for (let [, listener] of _.entries()){
            const r = listener(...args);
            if (r instanceof Promise) r.catch(console.error);
            if (listener.__once__) {
                delete listener.__once__;
                _.delete(listener);
            }
        }
        if (_.size === 0) this._events_.delete(event);
        return this;
    }
    async emit(event, ...args) {
        if (!this._events_.has(event)) return this;
        const _ = this._events_.get(event);
        for (let [, listener] of _.entries()){
            try {
                await listener(...args);
                if (listener.__once__) {
                    delete listener.__once__;
                    _.delete(listener);
                }
            } catch (error) {
                console.error(error);
            }
        }
        if (_.size === 0) this._events_.delete(event);
        return this;
    }
    queue(event, ...args) {
        (async ()=>await this.emit(event, ...args)
        )().catch(console.error);
        return this;
    }
    pull(event, timeout) {
        return new Promise(async (resolve, reject)=>{
            let timeoutId;
            let listener = (...args)=>{
                if (timeoutId !== null) clearTimeout(timeoutId);
                resolve(args);
            };
            timeoutId = typeof timeout !== "number" ? null : setTimeout(()=>(this.off(event, listener), reject(new Error("Timed out!")))
            );
            this.once(event, listener);
        });
    }
}
export { EventEmitter as EventEmitter };
function humanFriendlyBytes(bytes, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes + " B";
    }
    const units = si ? [
        "kB",
        "MB",
        "GB",
        "TB",
        "PB",
        "EB",
        "ZB",
        "YB"
    ] : [
        "KiB",
        "MiB",
        "GiB",
        "TiB",
        "PiB",
        "EiB",
        "ZiB",
        "YiB"
    ];
    let u = -1;
    const r = 10 ** dp;
    do {
        bytes /= thresh;
        ++u;
    }while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)
    return bytes.toFixed(dp) + " " + units[u];
}
function humanFriendlyPhrase(text) {
    return text.replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s\s+/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, (letter)=>letter.toUpperCase()
    );
}
export { humanFriendlyBytes as humanFriendlyBytes };
export { humanFriendlyPhrase as humanFriendlyPhrase };
function minWhitespaceIndent(text) {
    const match = text.match(/^[ \t]*(?=\S)/gm);
    return match ? match.reduce((r, a)=>Math.min(r, a.length)
    , Infinity) : 0;
}
function unindentWhitespace(text, removeInitialNewLine = true) {
    const indent = minWhitespaceIndent(text);
    const regex = new RegExp(`^[ \\t]{${indent}}`, "gm");
    const result = text.replace(regex, "");
    return removeInitialNewLine ? result.replace(/^\n/, "") : result;
}
function singleLineTrim(text) {
    return text.replace(/(\r\n|\n|\r)/gm, "").replace(/\s+(?=(?:[^\'"]*[\'"][^\'"]*[\'"])*[^\'"]*$)/g, " ").trim();
}
export { minWhitespaceIndent as minWhitespaceIndent };
export { unindentWhitespace as unindentWhitespace };
export { singleLineTrim as singleLineTrim };
const jsTokenEvalRE = /^[a-zA-Z0-9_]+$/;
function jsTokenEvalResult(identity, discover, isTokenValid, onInvalidToken, onFailedDiscovery) {
    let result;
    if (identity.match(jsTokenEvalRE)) {
        try {
            if (Array.isArray(discover)) {
                for (const te of discover){
                    result = te(identity);
                    if (result) break;
                }
            } else {
                result = discover(identity);
            }
            if (result && isTokenValid) result = isTokenValid(result, identity);
        } catch (error) {
            result = onFailedDiscovery?.(error, identity);
        }
    } else {
        result = onInvalidToken?.(identity);
    }
    return result;
}
const jsTokenEvalResults = {};
function cacheableJsTokenEvalResult(name1, discover = eval, onInvalidToken, onFailedDiscovery) {
    if (name1 in jsTokenEvalResults) return jsTokenEvalResults[name1];
    return jsTokenEvalResult(name1, discover, (value, name)=>{
        jsTokenEvalResults[name] = value;
        return value;
    }, onInvalidToken, onFailedDiscovery);
}
function flexibleArgs(argsSupplier, rulesSupplier) {
    const rules = rulesSupplier ? typeof rulesSupplier === "function" ? rulesSupplier(argsSupplier) : rulesSupplier : undefined;
    const defaultArgsSupplier = rules?.defaultArgs ?? {};
    const defaultArgs = typeof defaultArgsSupplier === "function" ? defaultArgsSupplier(argsSupplier, rules) : defaultArgsSupplier;
    let args = typeof argsSupplier === "function" ? argsSupplier(defaultArgs, rules) : argsSupplier ? {
        ...defaultArgs,
        ...argsSupplier
    } : defaultArgs;
    if (rules?.argsGuard) {
        if (!rules?.argsGuard.guard(args)) {
            args = rules.argsGuard.onFailure(args, rules);
        }
    }
    let result = {
        args,
        rules
    };
    if (rules?.finalizeResult) {
        result = rules.finalizeResult(result);
    }
    return result;
}
function governedArgs(argsSupplier, rulesSupplier) {
    const result = flexibleArgs(argsSupplier, rulesSupplier);
    return result;
}
export { jsTokenEvalResult as jsTokenEvalResult };
export { cacheableJsTokenEvalResult as cacheableJsTokenEvalResult };
export { flexibleArgs as flexibleArgs };
export { governedArgs as governedArgs };
const posixPathRE = /^((\/?)(?:[^\/]*\/)*)((\.{1,2}|[^\/]+?|)(\.[^.\/]*|))[\/]*$/;
function detectFileSysStyleRoute(text) {
    const components = posixPathRE.exec(text)?.slice(1);
    if (!components || components.length !== 5) return undefined;
    const modifiers = [];
    const parsedPath = {
        root: components[1],
        dir: components[0].slice(0, -1),
        base: components[2],
        ext: components[4],
        name: components[3],
        modifiers
    };
    const modifierIndex = parsedPath.name.lastIndexOf(".");
    if (modifierIndex > 0) {
        let ppn = parsedPath.name;
        let modifier = ppn.substring(modifierIndex);
        while(modifier && modifier.length > 0){
            modifiers.push(modifier);
            ppn = ppn.substring(0, ppn.length - modifier.length);
            const modifierIndex = ppn.lastIndexOf(".");
            modifier = modifierIndex > 0 ? ppn.substring(modifierIndex) : undefined;
        }
        parsedPath.name = ppn;
    }
    return parsedPath;
}
export { detectFileSysStyleRoute as detectFileSysStyleRoute };
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
class LabeledBadge {
    remoteBaseURL;
    useBadgenLib;
    importModule;
    #initialized = false;
    #isBadgenLibLoaded = false;
    autoHTML;
    constructor(argsSupplier){
        const { args  } = governedArgs(argsSupplier, {
            defaultArgs: {
                remoteBaseURL: 'https://badgen.net/badge',
                importModule: (lib, actuate)=>import(lib).then(actuate)
                ,
                useBadgenLib: true
            }
        });
        this.remoteBaseURL = args.remoteBaseURL;
        this.useBadgenLib = args.useBadgenLib;
        this.importModule = args.importModule;
    }
    badgenArgs(args) {
        const badgenArgs = {
            status: args.status || "status",
            ...args
        };
        return args?.enhanceBadgen ? args.enhanceBadgen(badgenArgs) : badgenArgs;
    }
    badgenRemoteURL(badgenArgs) {
        const badge = this.badgenArgs(badgenArgs);
        return `${this.remoteBaseURL}/${badge.label}/${badge.status}/${badge.color}`;
    }
    decorateHTML(badgenArgs, html) {
        if (badgenArgs.elaborationText) {
            html = `<span title="${badgenArgs.elaborationText}">${html}</span>`;
        }
        if (badgenArgs.actionable) {
            html = `<a onclick="${badgenArgs.actionable}">${html}</a>`;
        }
        return html;
    }
    badgenRemoteImageHTML(badgenArgs) {
        return this.decorateHTML(badgenArgs, `<img src="${this.badgenRemoteURL(badgenArgs)}">`);
    }
    init() {
        if (this.#initialized) return this;
        this.autoHTML = (badgenArgs)=>{
            return this.badgenRemoteImageHTML(badgenArgs);
        };
        if (this.useBadgenLib) {
            this.importModule("https://unpkg.com/badgen", ()=>{
                this.autoHTML = (badgenArgs)=>{
                    return this.decorateHTML(badgenArgs, badgen(this.badgenArgs(badgenArgs)));
                };
                this.#isBadgenLibLoaded = true;
            });
        }
        this.#initialized = true;
        return this;
    }
    get isBadgenLibLoaded() {
        return this.#isBadgenLibLoaded;
    }
}
class TunnelStatePresentation {
    static defaultInitialStatus = "inactive";
    summaryBadgeDomID;
    elaborationHtmlDomID;
    constructor(argsSupplier){
        const { args  } = governedArgs(argsSupplier, {
            defaultArgs: {
                summaryBadgeDomID: "rf-universal-tunnel-state-summary-badge",
                elaborationHtmlDomID: "rf-universal-tunnel-state-elaboration",
                initialStatus: TunnelStatePresentation.defaultInitialStatus,
                labeledBadge: new LabeledBadge().init(),
                defaultLabel: "Tunnel"
            }
        });
        this.summaryBadgeDomID = args.summaryBadgeDomID;
        this.elaborationHtmlDomID = args.elaborationHtmlDomID;
        this.labeledBadge = args.labeledBadge;
        this.defaultLabel = args.defaultLabel;
    }
    badgenArgs(state, options) {
        const status = state.status;
        const label = options?.label ?? this.defaultLabel;
        const color = options?.color ?? (status == "inactive" ? 'red' : status == "active" ? 'green' : 'orange');
        const icon = options?.icon;
        return this.labeledBadge.badgenArgs({
            label,
            labelColor: '555',
            status,
            color,
            style: 'classic',
            icon,
            iconWidth: 13,
            scale: 1,
            ...options
        });
    }
    update(state, options) {
        const tspElem = document.getElementById(this.summaryBadgeDomID);
        if (tspElem) {
            tspElem.innerHTML = this.labeledBadge.autoHTML(this.badgenArgs(state, options));
        } else {
            console.warn(`Tunnel state could not be updated: DOM element id='${this.summaryBadgeDomID}' was not found.`);
        }
    }
    display(state = true) {
        if (this.summaryBadgeElement) {
            this.summaryBadgeElement.style.display = state ? 'block' : 'none';
        }
    }
    get summaryBadgeElement() {
        return document.getElementById(this.summaryBadgeDomID);
    }
    get elaborationHtmlElement() {
        return document.getElementById(this.elaborationHtmlDomID);
    }
    get isStatisticsPresentationPossible() {
        return this.labeledBadge.isBadgenLibLoaded;
    }
}
class TunnelReconnectStrategy {
    static UNKNOWN = 0;
    static WAITING = 1;
    static TRYING = 2;
    static COMPLETED = 3;
    static ABORTED = 4;
    connect;
    report;
    maxAttempts;
    #attempt;
    #interval;
    #status = TunnelReconnectStrategy.UNKNOWN;
    constructor(connect, report, maxAttempts = 15){
        this.connect = connect;
        this.report = report;
        this.maxAttempts = maxAttempts;
        this.#attempt = 0;
    }
    get attempt() {
        return this.#attempt;
    }
    get status() {
        return this.#status;
    }
    set status(value) {
        this.#status = value;
        this.report(this);
    }
    get statusText() {
        switch(this.#status){
            case TunnelReconnectStrategy.UNKNOWN:
                return "unknown";
            case TunnelReconnectStrategy.WAITING:
                return "waiting";
            case TunnelReconnectStrategy.TRYING:
                return `reconnecting ${this.#attempt}/${this.maxAttempts}`;
            case TunnelReconnectStrategy.COMPLETED:
                return "reconnected";
            case TunnelReconnectStrategy.ABORTED:
                return "aborted";
        }
        return "?";
    }
    reconnect() {
        this.status = TunnelReconnectStrategy.WAITING;
        this.#interval = setInterval(()=>{
            this.#attempt++;
            if (this.#attempt > this.maxAttempts) {
                this.exit(TunnelReconnectStrategy.ABORTED);
            } else {
                this.status = TunnelReconnectStrategy.TRYING;
                this.connect(this);
            }
        }, 1000);
        return this;
    }
    exit(status = TunnelReconnectStrategy.COMPLETED) {
        this.status = status;
        if (this.#interval) {
            clearInterval(this.#interval);
            this.#interval = undefined;
        }
        return this;
    }
}
class EventSourceTunnelState {
    static instanceIndex = 0;
    static defaultInitialStatus = "inactive";
    esURL;
    esPingURL;
    #identity;
    #wrappedListeners = [];
    #eventSourceSupplier;
    #eventSource;
    #status;
    #statusErrorEvent;
    #statePresentation;
    #messageIdentitiesEncountered = {};
    constructor(tunnel, argsSupplier){
        this.esURL = `${tunnel.baseURL}/sse/tunnel`;
        this.esPingURL = `${tunnel.baseURL}/sse/ping`;
        const { args  } = governedArgs(argsSupplier, {
            defaultArgs: {
                eventSourceSupplier: ()=>new EventSource(this.esURL)
                ,
                statePresentation: ()=>tunnel.statePresentation
                ,
                identity: ()=>{
                    EventSourceTunnelState.instanceIndex++;
                    return `EventSourceTunnelState${EventSourceTunnelState.instanceIndex}`;
                },
                initialStatus: ()=>EventSourceTunnelState.defaultInitialStatus
            }
        });
        this.#eventSourceSupplier = args.eventSourceSupplier;
        this.#identity = args.identity();
        this.#status = args.initialStatus ? args.initialStatus() : EventSourceTunnelState.defaultInitialStatus;
        this.#statePresentation = args.statePresentation();
    }
    init(reconnector1 = undefined) {
        httpEndpointAvailableAction(this.esPingURL, (httpEAA)=>{
            this.#eventSource = this.#eventSourceSupplier();
            this.#eventSource.onopen = (event)=>{
                this.status = "active";
                if (reconnector1) reconnector1.exit();
            };
            this.#eventSource.onclose = (event)=>{
                this.status = "inactive";
                if (reconnector1) reconnector1.exit(TunnelReconnectStrategy.ABORTED);
            };
            this.#eventSource.onerror = (event)=>{
                this.#eventSource.close();
                this.#statusErrorEvent = event;
                this.status = "error";
                new TunnelReconnectStrategy((reconnector)=>{
                    this.init(reconnector);
                }, (reconnector)=>{
                    this.#statePresentation.update(this, {
                        enhanceBadgen: (suggested)=>{
                            suggested.status = reconnector.statusText;
                            return suggested;
                        }
                    });
                }).reconnect();
            };
            if (this.#wrappedListeners.length > 0) {
                this.#wrappedListeners.forEach((l)=>{
                    this.#eventSource.addEventListener(l.identity, l.wrappedCB);
                });
            }
        }, {
            onInvalidStatus: (event)=>{
                this.#status = "tunnel-unhealthy";
                this.#statePresentation.update(this, {
                    enhanceBadgen: (suggested)=>{
                        suggested.status = "unavailable";
                        suggested.elaborationText = `Ping URL ${this.esPingURL} is not available (click to hard-refresh)`;
                        suggested.elaborationHTML = `<a href="${this.esPingURL}">Ping URL</a> was not available.`;
                        suggested.actionable = ()=>{
                            httpHardRefreshURL();
                        };
                        return suggested;
                    }
                });
            }
        });
        return this;
    }
    get identity() {
        return this.#identity;
    }
    get status() {
        return this.#status;
    }
    set status(value) {
        this.#status = value;
        this.#statePresentation.update(this);
    }
    get statusErrorEvent() {
        return this.#statusErrorEvent;
    }
    get statePresentation() {
        return this.#statePresentation;
    }
    addEventSourceEventListener(identity, callback, options) {
        const wrappedCB = (event)=>{
            let encountered = this.#messageIdentitiesEncountered[identity];
            if (!encountered) {
                encountered = {
                    count: 0
                };
                this.#messageIdentitiesEncountered[identity] = encountered;
            }
            encountered.count++;
            const diagnose = options?.diagnose ?? false;
            if (diagnose) {
                console.info(`[TunnelState] message: ${identity}`, event, encountered);
            }
            callback(event);
        };
        this.#wrappedListeners.push({
            identity,
            wrappedCB,
            options
        });
        if (this.#eventSource) {
            this.#eventSource.addEventListener(identity, wrappedCB);
        }
        return this;
    }
}
class Tunnels {
    #esTunnels = {};
    constructor(argsSupplier){
        const { args  } = governedArgs(argsSupplier, {
            defaultArgs: {
                baseURL: "/tunnel",
                statePresentation: new TunnelStatePresentation()
            },
            hookableDomElemsAttrName: "tunnel-hook-args-supplier",
            hookableDomElems: [
                document.documentElement,
                document.head
            ]
        });
        this.baseURL = args.baseURL;
        this.statePresentation = args.statePresentation;
    }
    init() {
        return this;
    }
    registerEventSourceState(eventSourceTunnelStateArg) {
        const eventSourceTunnelState = typeof eventSourceTunnelStateArg === "function" ? eventSourceTunnelState(this) : eventSourceTunnelStateArg;
        eventSourceTunnelState.init();
        this.#esTunnels[eventSourceTunnelState.identity] = eventSourceTunnelState;
        return eventSourceTunnelState;
    }
}
export { LabeledBadge as LabeledBadge };
export { TunnelStatePresentation as TunnelStatePresentation };
export { TunnelReconnectStrategy as TunnelReconnectStrategy };
export { EventSourceTunnelState as EventSourceTunnelState };
export { Tunnels as Tunnels };
class UserAgentBus {
    #clientReqMessageBaseURL;
    #config;
    #registry = [];
    #identifiables = {};
    constructor(argsSupplier){
        this.#config = flexibleArgs(argsSupplier, {
            defaultArgs: {
                hookableDomElemsAttrName: "user-interactions-args-supplier",
                hookableDomElems: [
                    document.documentElement,
                    document.head
                ],
                domElemHookName: (element, potentialName = element.dataset.tunnelUi)=>{
                    return potentialName == "auto" || potentialName == "yes" ? `tuiHook_${element.id || `${element.tagName}_${this.registry.length}`}` : potentialName;
                },
                discoverDomElemHook (element, discover = eval) {
                    const hookName = this.domElemHookName(element);
                    const hookFactory = jsTokenEvalResult(hookName, discover, (value, name)=>value
                    , (name)=>{
                        console.log(`[UserAgentBus.discoverDomElemHook] '${name}' is not a token for current scope (${element.tagName} ${element.id})`, element);
                        return undefined;
                    }, (error, name)=>{
                        console.log(`[UserAgentBus.discoverDomElemHook] token discovery '${name}' generated error in current scope (${element.tagName} ${element.id}): ${error}`, error, element);
                        return undefined;
                    });
                    if (hookFactory) {
                        const hook = hookFactory(element, hookName, this);
                        hook.operationsEE.emit("constructed", {
                            element,
                            hookName,
                            hookFactory,
                            uab: this
                        });
                        return this.register(hook);
                    }
                    return undefined;
                },
                prepareClientReqMessage: (hook, message)=>{
                    return {
                        nature: "UserAgentBus.message",
                        tuiHookIdentity: hook.identity,
                        ...message
                    };
                },
                determineMessageHook: (message, onNotFound = this.args.onHandleMessageHookIdNotFound)=>{
                    const attemptedHookID = message.tuiHookIdentity;
                    if (attemptedHookID) {
                        let hook = this.#identifiables[attemptedHookID];
                        if (!hook) hook = onNotFound(message, attemptedHookID, this);
                        return hook;
                    }
                    return this.args.onHandleMessageHookIdNotProvided(message, this);
                },
                onDuplicateControlHook: (newHook, existingHook, identity)=>{
                    console.warn(`[UserAgentBus.register] duplicate controlHook '${identity}' registered.`, newHook, existingHook, identity);
                    return newHook;
                },
                onHandleMessageHookIdNotProvided: (message)=>{
                    console.warn(`[UserAgentBus.onHandleMessageHookIdNotProvided] controlHook ID not provided in message (expecting message.tuiHookIdentity property).`, message, this.identifiables);
                    return undefined;
                },
                onHandleMessageHookIdNotFound: (message, attemptedHookID)=>{
                    console.warn(`[UserAgentBus.onHandleMessageHookIdNotFound] controlHook ID '${attemptedHookID}' in message not found.`, message, this.identifiables);
                    return undefined;
                }
            }
        });
        this.#clientReqMessageBaseURL = this.#config.args.clientReqMessageBaseURL;
        if (!this.#clientReqMessageBaseURL) throw Error("this.#config.args.clientReqMessageBaseURL expected in new UserAgentBus({ clientReqMessageBaseURL: ? })");
    }
    get clientReqMessageBaseURL() {
        return this.#clientReqMessageBaseURL;
    }
    get config() {
        return this.#config;
    }
    get args() {
        return this.#config.args;
    }
    get registry() {
        return this.#registry;
    }
    get domElemHookName() {
        return this.#config.args.domElemHookName;
    }
    get discoverDomElemHook() {
        return this.#config.args.discoverDomElemHook;
    }
    get identifiables() {
        return this.#identifiables;
    }
    get prepareClientReqMessage() {
        return this.#config.args.prepareClientReqMessage;
    }
    register(constructedHook) {
        let registeredHook = constructedHook;
        const identity = registeredHook.identity;
        this.#registry.push(registeredHook);
        if (identity) {
            const existing = this.#identifiables[identity];
            if (existing && this.args.onDuplicateControlHook) {
                registeredHook = this.args.onDuplicateControlHook(registeredHook, existing, identity);
            }
            if (registeredHook) {
                this.#identifiables[identity] = registeredHook;
                const { operationsEE  } = registeredHook;
                operationsEE.on("user-agent-request", (message)=>{
                    this.sendClientReqMessage(registeredHook, message, true);
                });
                operationsEE.on("user-agent-notification", (message)=>{
                    this.sendClientReqMessage(registeredHook, message, false);
                });
                operationsEE.emit("registered", {
                    uab: this,
                    identity
                });
            }
        }
        return this;
    }
    sendClientReqMessage(hook, message1, fullDuplex) {
        const transactionID = "TODO:UUIDv5?";
        const clientProvenance = 'UserAgentBus.sendClientMessage';
        const endpoint = this.#clientReqMessageBaseURL;
        const payload = this.prepareClientReqMessage(hook, {
            ...message1,
            transactionID,
            endpoint,
            clientProvenance,
            uab: this
        });
        console.log("[UserAgentBus.sendClientMessage]", payload);
        const body = JSON.stringify(payload);
        if (fullDuplex) {
            fetch(endpoint, {
                method: "POST",
                body
            }).then((res)=>res.json()
            ).then((message)=>{
                hook.operationsEE.emit("user-agent-server-response", {
                    ...message,
                    transactionID,
                    endpoint,
                    clientProvenance,
                    uab: this
                });
            }).catch((error)=>{
                hook.operationsEE.emit("user-agent-request-error", {
                    body,
                    error,
                    transactionID,
                    uab: this
                });
                console.error(`${endpoint} POST error`, body, error);
            });
        } else {
            fetch(endpoint, {
                method: "POST",
                body
            }).catch((error)=>{
                hook.operationsEE.emit("user-agent-notification-error", {
                    body,
                    error,
                    transactionID,
                    uab: this
                });
                console.error(`${endpoint} POST error`, body, error);
            });
        }
    }
    handleServerMessage(message, onNotFound) {
        const hook = this.args.determineMessageHook(message, onNotFound);
        if (hook) {
            const clientProvenance = 'UserAgentBus.handleServerMessage';
            hook.operationsEE.emit("server-notification", {
                ...message,
                endpoint,
                clientProvenance,
                uab: this
            });
        }
    }
    async init() {
        console.log(`[UserAgentBus.init]`, this);
        return this;
    }
}
export { UserAgentBus as UserAgentBus };
function markdownItTransformer() {
    return {
        dependencies: undefined,
        acquireDependencies: async (transformer)=>{
            const { default: markdownIt  } = await import("https://jspm.dev/markdown-it@12.2.0");
            return {
                markdownIt,
                plugins: await transformer.plugins()
            };
        },
        construct: async (transformer)=>{
            if (!transformer.dependencies) {
                transformer.dependencies = await transformer.acquireDependencies(transformer);
            }
            const markdownIt = transformer.dependencies.markdownIt({
                html: true,
                linkify: true,
                typographer: true
            });
            transformer.customize(markdownIt, transformer);
            return markdownIt;
        },
        customize: (markdownIt, transformer)=>{
            const plugins = transformer.dependencies.plugins;
            markdownIt.use(plugins.footnote);
            return transformer;
        },
        unindentWhitespace: (text, removeInitialNewLine = true)=>{
            const whitespace = text.match(/^[ \t]*(?=\S)/gm);
            const indentCount = whitespace ? whitespace.reduce((r, a)=>Math.min(r, a.length)
            , Infinity) : 0;
            const regex = new RegExp(`^[ \\t]{${indentCount}}`, "gm");
            const result = text.replace(regex, "");
            return removeInitialNewLine ? result.replace(/^\n/, "") : result;
        },
        plugins: async ()=>{
            const { default: footnote  } = await import("https://jspm.dev/markdown-it-footnote@3.0.3");
            return {
                footnote,
                adjustHeadingLevel: (md, options)=>{
                    function getHeadingLevel(tagName) {
                        if (tagName[0].toLowerCase() === 'h') {
                            tagName = tagName.slice(1);
                        }
                        return parseInt(tagName, 10);
                    }
                    const firstLevel = options.firstLevel;
                    if (typeof firstLevel === 'string') {
                        firstLevel = getHeadingLevel(firstLevel);
                    }
                    if (!firstLevel || isNaN(firstLevel)) {
                        return;
                    }
                    const levelOffset = firstLevel - 1;
                    if (levelOffset < 1 || levelOffset > 6) {
                        return;
                    }
                    md.core.ruler.push("adjust-heading-levels", function(state) {
                        const tokens = state.tokens;
                        for(let i = 0; i < tokens.length; i++){
                            if (tokens[i].type !== "heading_close") {
                                continue;
                            }
                            const headingOpen = tokens[i - 2];
                            const headingClose = tokens[i];
                            const currentLevel = getHeadingLevel(headingOpen.tag);
                            const tagName = 'h' + Math.min(currentLevel + levelOffset, 6);
                            headingOpen.tag = tagName;
                            headingClose.tag = tagName;
                        }
                    });
                }
            };
        }
    };
}
async function renderMarkdown(strategies, mditt = markdownItTransformer()) {
    const markdownIt = await mditt.construct(mditt);
    for await (const strategy of strategies(mditt)){
        const markdown = mditt.unindentWhitespace(await strategy.markdownText(mditt));
        strategy.renderHTML(markdownIt.render(markdown), mditt);
    }
}
function importMarkdownContent(input, select, inject) {
    fetch(input).then((resp)=>{
        resp.text().then((html)=>{
            const parser = new DOMParser();
            const foreignDoc = parser.parseFromString(html, "text/html");
            const selected = select(foreignDoc);
            if (Array.isArray(selected)) {
                for (const s of selected){
                    const importedNode = document.adoptNode(s);
                    inject(importedNode, input, html);
                }
            } else if (selected) {
                const importedNode = document.adoptNode(selected);
                inject(importedNode, input, html);
            }
        });
    });
}
async function transformMarkdownElemsCustom(srcElems, finalizeElemFn, mditt = markdownItTransformer()) {
    await renderMarkdown(function*() {
        for (const elem of srcElems){
            yield {
                markdownText: async ()=>{
                    if (elem.dataset.transformableSrc) {
                        const response = await fetch(elem.dataset.transformableSrc);
                        if (!response.ok) {
                            return `Error fetching ${elem.dataset.transformableSrc}: ${response.status}`;
                        }
                        return await response.text();
                    } else {
                        return elem.innerText;
                    }
                },
                renderHTML: async (html)=>{
                    try {
                        const formatted = document.createElement("div");
                        formatted.innerHTML = html;
                        elem.parentElement.replaceChild(formatted, elem);
                        if (finalizeElemFn) finalizeElemFn(formatted, elem);
                    } catch (error) {
                        console.error("Undiagnosable error in renderHTML()", error);
                    }
                }
            };
        }
    }, mditt);
}
async function transformMarkdownElems(firstHeadingLevel = 2) {
    const mdittDefaults = markdownItTransformer();
    await transformMarkdownElemsCustom(document.querySelectorAll(`[data-transformable="markdown"]`), (mdHtmlElem, mdSrcElem)=>{
        mdHtmlElem.dataset.transformedFrom = "markdown";
        if (mdSrcElem.className) mdHtmlElem.className = mdSrcElem.className;
        document.dispatchEvent(new CustomEvent("transformed-markdown", {
            detail: {
                mdHtmlElem,
                mdSrcElem
            }
        }));
    }, {
        ...mdittDefaults,
        customize: (markdownIt, transformer)=>{
            mdittDefaults.customize(markdownIt, transformer);
            markdownIt.use(transformer.dependencies.plugins.adjustHeadingLevel, {
                firstLevel: firstHeadingLevel
            });
        }
    });
}
export { markdownItTransformer as markdownItTransformer };
export { renderMarkdown as renderMarkdown };
export { importMarkdownContent as importMarkdownContent };
export { transformMarkdownElemsCustom as transformMarkdownElemsCustom };
export { transformMarkdownElems as transformMarkdownElems };