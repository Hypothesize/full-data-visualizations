# Development

## Getting started

Everything is currently being bundled with [Parcel](https://parceljs.org/). You can run the bundler and development server using:

```bash
npm run watch
```

This will watch the `/demo/index.html` file and all its dependencies for changes and will rebuild as necessary, outputting newly-built content to the `dist` folder. The served page will be available in the browser at [http://localhost:1234](http://localhost:1234).

## Static assets

I don't know how common this is, but Parcel expects static assets to be referenced using URLs constructed in a particular way:

```js
const url = new URL("./path/to/some/resource", import.meta.url)
const resource = await loadSomeResource(url)
```

In other words, it expects URLs to be constructed using the `URL` class with `import.meta.url` as the second argument passed into the constructor. I mention this because these URLs may have to be changed if your bundler doesn't use or understand this way of doing things!
