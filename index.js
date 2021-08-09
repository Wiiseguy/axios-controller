const buildControllerDefaultOpts = {
    unwrap: true
};

// Unwrap an axios result object
function unwrap(promise) {
    return promise.then(res => {
        return res.data;
    }).catch(err => {
        if (err.response) {
            return Promise.reject(err.response.data);
        } else {
            return Promise.reject(err);
        }
    });
}

function delayPromise(resolveValue, ms) {
    return new Promise((resolve) => {
        setTimeout(_ =>
            resolve(resolveValue),
            ms);
    });
}

function removeLeadingSlashes(url) {
    if(typeof url !== 'string') return '';
    url = url.trimStart();
    return url.replace(/^\/+/, '');
}

function removeTrailingSlashes(url) {
    if(typeof url !== 'string') return '';
    url = url.trimStart();
    return url.replace(/\/+$/, '');
}

function removeLeadingAndTrailingSlashes(url) {
    url = removeLeadingSlashes(url);
    url = removeTrailingSlashes(url);
    return url;
}

function appendSlash(url) {
    if(typeof url !== 'string') return '/';
    url = url.trimEnd(); 
    if(!url.endsWith('/')) return url + '/';
    return url;
}

function toAbsoluteUrl(url) {
    const a = document.createElement('a');
    a.href = url;
    return a.href;
}

function createEmptyProxy() {
    return {};
}

function buildController(proxy, opts) {
    opts = {
        ...buildControllerDefaultOpts, 
        ...opts
    };
    return function (controller, fn) {
        fn = fn || createEmptyProxy;

        const ctrlProxy = {
            get(url = '', ...args) {
                return proxy.get(controller + '/' + url, ...args);
            },
            head(url = '', ...args) {
                return proxy.head(controller + '/' + url, ...args);
            },
            post(url = '', ...args) {
                if (typeof url !== 'string') {
                    args = [url];
                    url = '';
                }
                return proxy.post(controller + '/' + url, ...args);
            },
            put(url = '', ...args) {
                if (typeof url !== 'string') {
                    args = [url];
                    url = '';
                }
                return proxy.put(controller + '/' + url, ...args);
            },
            patch(url = '', ...args) {
                if (typeof url !== 'string') {
                    args = [url];
                    url = '';
                }
                return proxy.patch(controller + '/' + url, ...args);
            },
            delete(url = '', ...args) {
                return proxy.delete(controller + '/' + url, ...args);
            }
        };

        const ctrl = fn(ctrlProxy);
        if(opts.unwrap) {
            Object
                .entries(ctrl)
                .forEach(([key, val]) =>                 
                    ctrl[key] = (...args) => unwrap(val(...args))                
                );
        }

        ctrl.getUri = (...args) => {
            const url = removeTrailingSlashes(controller) + '/' + args.map(u => removeLeadingAndTrailingSlashes(u)).join('/') + '';
            const baseUrl = removeTrailingSlashes(toAbsoluteUrl(proxy.defaults.baseURL));
            return new URL(removeLeadingSlashes(url), appendSlash(baseUrl)).toString()
        };

        return ctrl;
    }
}

module.exports = {
    unwrap,
    delayPromise,
    buildController
}