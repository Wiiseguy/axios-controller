const test = require('aqa');
const axios = require('axios')
const jsdom = require("jsdom");
const { buildController } = require('./index.js');

// Mock DOM
const { JSDOM } = jsdom;
const dom = new JSDOM();
dom.reconfigure({ url: "http://mock/" });
global.document = dom.window.document;

function createMockProxy() {
    const calls=[];
    return {
        _calls() { return calls; },
        async get()     { calls.push(['get', ...arguments]); return { data: 'get' }; },
        async head()    { calls.push(['head', ...arguments]); return { data: 'head' }; },
        async post()    { calls.push(['post', ...arguments]); return { data: 'post' }; },
        async put()     { calls.push(['put', ...arguments]); return { data: 'put' }; },
        async patch()   { calls.push(['patch', ...arguments]); return { data: 'patch' }; },
        async delete()  { calls.push(['delete', ...arguments]); return { data: 'delete' }; },
    }
}

test('proxy test', async t => {
    let proxy = createMockProxy();
    let Controller = buildController(proxy);
    
    let bookController = Controller('book', http => {
        return {
            all: _ => http.get(),
            get: id => http.get(id),
            head: id => http.head(id),
            create: book => http.post(book),
            update: book => http.put(book),
            patch: book => http.patch(book),
            delete: id => http.delete(id),
        }
    });

    let r1 = await bookController.all();
    let r2 = await bookController.get(1);
    let r3 = await bookController.create({id:2});
    let r4 = await bookController.update({id:2});
    let r5 = await bookController.delete(2);
    let r6 = await bookController.head(1);
    let r7 = await bookController.patch({id:2});
    
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
    
    t.is(calls[1][0], 'get')
    t.is(calls[1][1], 'book/1')

    t.is(calls[2][0], 'post')
    t.is(calls[2][1], 'book/')
    t.is(calls[2][2].id, 2)

    t.is(calls[3][0], 'put')
    t.is(calls[3][1], 'book/')
    t.is(calls[3][2].id, 2)

    t.is(calls[4][0], 'delete')
    t.is(calls[4][1], 'book/2')

    t.is(calls[5][0], 'head')
    t.is(calls[5][1], 'book/1')

    t.is(calls[6][0], 'patch')
    t.is(calls[6][1], 'book/')
});

test('proxy test - no unwrap', async t => {
    let proxy = createMockProxy();
    let Controller = buildController(proxy, {unwrap:false});
    
    let bookController = Controller('book', http => {
        return {
            all: _ => http.get()
        }
    });

    let r1 = await bookController.all();
    
    // Test mock reponses
    t.is(r1.data, 'get');

    // Test mock calls
    let calls = proxy._calls();
    t.is(calls[0][0], 'get');
    t.is(calls[0][1], 'book/');
});


test('url test', async t => {
    let proxy = axios.create({ baseURL: 'http://www.example.app/api' });
    let Controller = buildController(proxy);
    
    let bookController = Controller('book', (http, ctrl) => {
        return {
            url1: _ => ctrl.url('test'),
            url2: _ => ctrl.url('test', 'foo', 'bar'),
            url3: _ => ctrl.url(''),
            url4: _ => ctrl.url(),
            url5: _ => ctrl.url('/test'),
        }
    });
    
    // Test mock reponses
    t.is(bookController.getUri('test'), 'http://www.example.app/api/book/test');
    t.is(bookController.getUri('test', 'foo', 'bar'), 'http://www.example.app/api/book/test/foo/bar');
    t.is(bookController.getUri(''), 'http://www.example.app/api/book/');
    t.is(bookController.getUri(), 'http://www.example.app/api/book/');
    t.is(bookController.getUri('/test'), 'http://www.example.app/api/book/test');
});

test('url test - relative baseURL', async t => {
    /* global.document = {
        createElement() {
            
        }
    }; */
    let proxy = axios.create({ baseURL: '/api' });
    let Controller = buildController(proxy);
    
    let bookController = Controller('book', (http, ctrl) => {
        return {
            url1: _ => ctrl.url('test'),
            url2: _ => ctrl.url('test', 'foo', 'bar'),
            url3: _ => ctrl.url(''),
            url4: _ => ctrl.url(),
            url5: _ => ctrl.url('/test'),
        }
    });
    
    // Test mock reponses
    t.is(bookController.getUri('test'), 'http://mock/api/book/test');
    t.is(bookController.getUri('test', 'foo', 'bar'), 'http://mock/api/book/test/foo/bar');
    t.is(bookController.getUri(''), 'http://mock/api/book/');
    t.is(bookController.getUri(), 'http://mock/api/book/');
    t.is(bookController.getUri('/test'), 'http://mock/api/book/test');
});

test('url test - all trailing and leading slashes', async t => {
    let proxy = axios.create({ baseURL: 'http://www.example.app/api/' });
    let Controller = buildController(proxy);
    
    let bookController = Controller('/book', (http, ctrl) => {
        return {
            url1: _ => ctrl.url('/test/'),
            url2: _ => ctrl.url('/test/', '/foo/', '/bar/'),
            url3: _ => ctrl.url('/'),
            url4: _ => ctrl.url(),
            url5: _ => ctrl.url('////test'),
        }
    });
    
    // Test mock reponses
    t.is(bookController.getUri('test'), 'http://www.example.app/api/book/test');
    t.is(bookController.getUri('test', 'foo', 'bar'), 'http://www.example.app/api/book/test/foo/bar');
    t.is(bookController.getUri(''), 'http://www.example.app/api/book/');
    t.is(bookController.getUri(), 'http://www.example.app/api/book/');
    t.is(bookController.getUri('/test'), 'http://www.example.app/api/book/test');
});