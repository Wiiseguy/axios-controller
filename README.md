# axios-controller
Easily create a proxy that matches your Web API Controller.

### Installation
```
npm i axios-controller
```

### Usage

#### Usage with Axios

```js
const { buildController } = require('axios-controller');

const axiosInstance = axios.create({
  baseURL: 'https://api.example.com/'
});

let Controller = buildController(axiosInstance);

let bookController = Controller('book', http => {
  return {
    all: _ => http.get(),
    get: id => http.get(id),
    create: book => http.post(book),
    update: book => http.put(book),
    delete: id => http.delete(id),
  }
});

// You can use Controller to create multiple controller proxies
let authorController = Controller('author', http => {
  return {
    get: id => http.get(id),
    getBooksByAuthor: id => http.get(`books/${id}`)
  }
});

await bookController.get(1); // { id: 1, author: 8, title: 'ABC' }

await authorController.getBooksByAuthor(8); // [{ id: 1, author: 8, title: 'ABC' }, ...]
```

#### No response unwrapping

Note that axios-controller will 'unwrap' the response object. This means that by default the `data` property of the Axios response will be returned.
You can disable this behavior by setting the `unwrap` option to false:

```js
let Controller = buildController(axiosInstance, { unwrap: false });
```
