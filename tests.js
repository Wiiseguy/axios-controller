/* c8 ignore start */
const test = require('aqa');
const jsdom = require('jsdom');
const axios = require('axios').default;
const axiosController = require('./axios-controller');

// Mock DOM
const { JSDOM } = jsdom;
const dom = new JSDOM();
dom.reconfigure({ url: 'http://mock/' });
global.document = dom.window.document;

function createMockProxy(baseURL = '/api') {
    const calls = [];
    return {
        _calls() {
            return calls;
        },
        async get() {
            calls.push(['get', ...arguments]);
            return { data: 'get' };
        },
        async head() {
            calls.push(['head', ...arguments]);
            return { data: 'head' };
        },
        async post() {
            calls.push(['post', ...arguments]);
            return { data: 'post' };
        },
        async put() {
            calls.push(['put', ...arguments]);
            return { data: 'put' };
        },
        async patch() {
            calls.push(['patch', ...arguments]);
            return { data: 'patch' };
        },
        async delete() {
            calls.push(['delete', ...arguments]);
            return { data: 'delete' };
        },
        defaults: {
            baseURL: baseURL
        }
    };
}

test('proxy test', async t => {
    let proxy = createMockProxy();
    let Controller = axiosController.build(proxy);

    let bookController = Controller('book', http => ({
        all: _ => http.get(),
        get: id => http.get(id),
        head: id => http.head(id),
        create: book => http.post(book),
        update: book => http.put(book),
        patch: book => http.patch(book),
        delete: id => http.delete(id)
    }));

    let r1 = await bookController.all();
    let r2 = await bookController.get(1);
    let r3 = await bookController.create({ id: 2 });
    let r4 = await bookController.update({ id: 2 });
    let r5 = await bookController.delete(2);
    let r6 = await bookController.head(1);
    let r7 = await bookController.patch({ id: 2 });

    // Test mock reponses
    t.is(r1, 'get');
    t.is(r2, 'get');
    t.is(r3, 'post');
    t.is(r4, 'put');
    t.is(r5, 'delete');
    t.is(r6, 'head');
    t.is(r7, 'patch');

    // Test mock calls
    let calls = proxy._calls();
    t.is(calls[0][0], 'get');
    t.is(calls[0][1], 'book/');

    t.is(calls[1][0], 'get');
    t.is(calls[1][1], 'book/1');

    t.is(calls[2][0], 'post');
    t.is(calls[2][1], 'book/');
    t.is(calls[2][2].id, 2);

    t.is(calls[3][0], 'put');
    t.is(calls[3][1], 'book/');
    t.is(calls[3][2].id, 2);

    t.is(calls[4][0], 'delete');
    t.is(calls[4][1], 'book/2');

    t.is(calls[5][0], 'head');
    t.is(calls[5][1], 'book/1');

    t.is(calls[6][0], 'patch');
    t.is(calls[6][1], 'book/');
});

test('proxy test - no unwrap', async t => {
    let proxy = createMockProxy();
    let Controller = axiosController.build(proxy, { unwrap: false });

    let bookController = Controller('book', http => ({
        all: _ => http.get()
    }));

    let r1 = await bookController.all();

    // Test mock reponses
    t.is(r1.data, 'get');

    // Test mock calls
    let calls = proxy._calls();
    t.is(calls[0][0], 'get');
    t.is(calls[0][1], 'book/');
});

test('proxy test - real axios instance', async t => {
    let proxy = axios.create({ baseURL: 'https://www.iana.org/' });
    let Controller = axiosController.build(proxy);

    let ctrl = Controller('help', http => ({
        example: _ => http.get('example-domains')
    }));

    let r1 = await ctrl.example();
    t.is(r1.includes('<html>'), true);
});

test('proxy test - real axios instance - no unwrap', async t => {
    let proxy = axios.create({ baseURL: 'https://www.iana.org/' });
    let Controller = axiosController.build(proxy, { unwrap: false });

    let ctrl = Controller('help', http => ({
        example: _ => http.get('example-domains')
    }));

    let r1 = await ctrl.example();
    t.is(r1.status, 200);
    t.is(r1.statusText, 'OK');
    t.is(r1.data.includes('<html>'), true);
});

test('getUri - mock', async t => {
    let proxy = createMockProxy('http://www.example.app/api/');
    let Controller = axiosController.build(proxy);

    let bookController = Controller('book');

    // Test mock reponses
    t.is(bookController.getUri('test'), 'http://www.example.app/api/book/test');
    t.is(bookController.getUri('test', 'foo', 'bar'), 'http://www.example.app/api/book/test/foo/bar');
    t.is(bookController.getUri(), 'http://www.example.app/api/book/');
    t.is(bookController.getUri(''), 'http://www.example.app/api/book/');
    t.is(bookController.getUri('test/'), 'http://www.example.app/api/book/test');
    t.is(bookController.getUri('/test/'), 'http://www.example.app/api/book/test');
    t.is(bookController.getUri('/test'), 'http://www.example.app/api/book/test');
    t.is(bookController.getUri('/'), 'http://www.example.app/api/book/');
});

test('getUri - mock relative', async t => {
    let proxy = createMockProxy('');
    let Controller = axiosController.build(proxy);

    let bookController = Controller('book');

    // Test mock reponses
    t.is(bookController.getUri('test'), 'http://mock/book/test');
    t.is(bookController.getUri('test', 'foo', 'bar'), 'http://mock/book/test/foo/bar');
    t.is(bookController.getUri(), 'http://mock/book/');
    t.is(bookController.getUri(''), 'http://mock/book/');
    t.is(bookController.getUri('test/'), 'http://mock/book/test');
    t.is(bookController.getUri('/test/'), 'http://mock/book/test');
    t.is(bookController.getUri('/test'), 'http://mock/book/test');
    t.is(bookController.getUri('/'), 'http://mock/book/');
});

test('getUri - real axios instance', async t => {
    let proxy = axios.create({ baseURL: 'http://www.example.app/api' });
    let Controller = axiosController.build(proxy);

    let bookController = Controller('book');

    // Test mock reponses
    t.is(bookController.getUri('test'), 'http://www.example.app/api/book/test');
    t.is(bookController.getUri('test', 'foo', 'bar'), 'http://www.example.app/api/book/test/foo/bar');
    t.is(bookController.getUri(), 'http://www.example.app/api/book/');
    t.is(bookController.getUri(''), 'http://www.example.app/api/book/');
    t.is(bookController.getUri('test/'), 'http://www.example.app/api/book/test');
    t.is(bookController.getUri('/test/'), 'http://www.example.app/api/book/test');
    t.is(bookController.getUri('/test'), 'http://www.example.app/api/book/test');
    t.is(bookController.getUri('/'), 'http://www.example.app/api/book/');
});

test('getUri - relative baseURL', async t => {
    let proxy = axios.create({ baseURL: '/api' });
    let Controller = axiosController.build(proxy);

    let bookController = Controller('book');

    // Test mock reponses
    t.is(bookController.getUri('test'), 'http://mock/api/book/test');
    t.is(bookController.getUri('test', 'foo', 'bar'), 'http://mock/api/book/test/foo/bar');
    t.is(bookController.getUri(), 'http://mock/api/book/');
    t.is(bookController.getUri(''), 'http://mock/api/book/');
    t.is(bookController.getUri('test/'), 'http://mock/api/book/test');
    t.is(bookController.getUri('/test/'), 'http://mock/api/book/test');
    t.is(bookController.getUri('/test'), 'http://mock/api/book/test');
    t.is(bookController.getUri('/'), 'http://mock/api/book/');
});

test('getUri - all trailing and leading slashes', async t => {
    let proxy = axios.create({ baseURL: 'http://www.example.app/api//' });
    let Controller = axiosController.build(proxy);

    let bookController = Controller('//book//');

    // Test mock reponses
    t.is(bookController.getUri('//test//'), 'http://www.example.app/api/book/test');
    t.is(bookController.getUri('/test/', '/foo/', '/bar/'), 'http://www.example.app/api/book/test/foo/bar');
    t.is(bookController.getUri('/'), 'http://www.example.app/api/book/');
    t.is(bookController.getUri(), 'http://www.example.app/api/book/');
    t.is(bookController.getUri('////test///'), 'http://www.example.app/api/book/test');
});

test('bad controller method', async t => {
    let proxy = createMockProxy();
    let Controller = axiosController.build(proxy);

    let bookController = Controller('book', http => ({
        notAFunction: 1,
        notAPromise: _ => 1,
        nullPromise: _ => Promise.resolve(null),
        rejectingPromise: _ => Promise.reject(new Error('test')),
        rejectingPromiseWithResponseData: _ => Promise.reject({ message: 'test2', response: { data: { login_failure: ['data_test2'] } } }),
    }));

    let e1 = await t.throwsAsync(async () => {
        await bookController.notAFunction();
    })
    t.true(e1 instanceof TypeError);

    let r1 = await bookController.notAPromise();
    t.is(r1, 1);

    let e2 = await t.throwsAsync(async () => {
        await bookController.rejectingPromise();
    })
    t.is(e2.message, 'test');

    let e3 = await t.throwsAsync(async () => {
        await bookController.rejectingPromiseWithResponseData();
    })
    t.is(e3.message, 'test2');
    t.deepEqual(e3.cause, { login_failure: ['data_test2'] });

    let r2 = await bookController.nullPromise();
    t.is(r2, null);

    
});

test('removeLeadingSlashes', async t => {
    let sut = axiosController.removeLeadingSlashes;

    t.is(sut(null), '');
    t.is(sut(''), '');
    t.is(sut('/'), '');
    t.is(sut('//'), '');
    t.is(sut('test'), 'test');
    t.is(sut('test/'), 'test/');
    t.is(sut('/test'), 'test');
    t.is(sut('/test/'), 'test/');
});

test('removeTrailingSlashes', async t => {
    let sut = axiosController.removeTrailingSlashes;

    t.is(sut(null), '');
    t.is(sut(''), '');
    t.is(sut('/'), '');
    t.is(sut('//'), '');
    t.is(sut('test'), 'test');
    t.is(sut('test/'), 'test');
    t.is(sut('/test'), '/test');
    t.is(sut('/test/'), '/test');
});

test('removeLeadingAndTrailingSlashes', async t => {
    let sut = axiosController.removeLeadingAndTrailingSlashes;

    t.is(sut(null), '');
    t.is(sut(''), '');
    t.is(sut('/'), '');
    t.is(sut('//'), '');
    t.is(sut('test'), 'test');
    t.is(sut('test/'), 'test');
    t.is(sut('/test'), 'test');
    t.is(sut('/test/'), 'test');
});

test('appendSlash', async t => {
    let sut = axiosController.appendSlash;

    t.is(sut(null), '/');
    t.is(sut(''), '/');
    t.is(sut('/'), '/');
    t.is(sut('//'), '//');
    t.is(sut('test'), 'test/');
    t.is(sut('test/'), 'test/');
    t.is(sut('/test'), '/test/');
    t.is(sut('/test/'), '/test/');
});