const buildControllerDefaultOpts = {
    unwrap: true
}

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

function buildController(proxy, opts) {
    opts = {
        ...buildControllerDefaultOpts, 
        ...opts
    };
    return function (controller, fn) {
        let ctrlProxy = {
            get: function (url = '', ...args) {
                return proxy.get(controller + '/' + url, ...args);
            },
            head: function (url = '', ...args) {
                return proxy.head(controller + '/' + url, ...args);
            },
            post: function (url = '', ...args) {
                if (typeof url !== 'string') {
                    args = [url];
                    url = '';
                }
                return proxy.post(controller + '/' + url, ...args);
            },
            put: function (url = '', ...args) {
                if (typeof url !== 'string') {
                    args = [url];
                    url = '';
                }
                return proxy.put(controller + '/' + url, ...args);
            },
            patch: function (url = '', ...args) {
                if (typeof url !== 'string') {
                    args = [url];
                    url = '';
                }
                return proxy.patch(controller + '/' + url, ...args);
            },
            delete: function (url = '', ...args) {
                return proxy.delete(controller + '/' + url, ...args);
            }
        };

        let ctrl = fn(ctrlProxy);
        Object.entries(ctrl).forEach(([key, val]) => {
            if(opts.unwrap) {
                ctrl[key] = function () {
                    return unwrap(val(...arguments));
                };
            }
        });

        return ctrl;
    }
}

module.exports = {
    unwrap,
    delayPromise,
    buildController
}