# Contributing

These are some of the basic guidelines you should follow while developing this plugin. While none of us are in grade school any more, these are made to make all of our lives easier even if they seem like a hassle at first.

[Dependencies](#dependencies)

[Coding Practices](#practices)

[Comments, JSDoc, Types](#types)

## Dependencies

Short answer: Don't.

Long answer: Please don't.

Our goals are:

- 0 dependencies
- under 4kb minified/gzipped

## Practices

[Microbundle](https://github.com/developit/microbundle) does most (see also: all) of the heavy lifting for us.

That does not mean that you should use the latest and greatest. If you add or rewrite a part of the code, make sure to test both bundles. While Microbundle will run code through Babel, some of the polyfills may not transfer to the WebWorker properly.

It is always better to lean towards explicit functions and variables over code golfing.

## Types

This project takes advantage of [JSDoc](https://jsdoc.app/index.html) to comment and record functions, parameters, and classes. Editors that support JSDoc automatically read/interpret comments and turn it into TypeScript like documentation, which gives everyone access to safer code without the steep learning curve and config fatigue that Typescript has.

### When do I need to add an `@typedef`?

Probably not at all. At the time of writing (5/4/2020), there are 4.

These `@typedef` are used because they represent large objects or objects that return complex variables.

Example:

```js
EncodedMessage.M = number[][]; // Array -> Array -> number

WorkerResponse.verification = Verifcation[] // Array -> Verification{ nonce: number, time: number, question: string }
```

If you are running into a large object/complex variable, it may be a sign that the code needs to be reevaluated.

### When do I need to add an `@param`?

Lean towards always adding `@param` notes. We don't always write our functions as explicitly as we should. Sometimes a `numberToHexString(num)` gets written as `toHexStr(n)`. For a veteran of a project, thats not a big deal. Not very accessible for someone just coming in. Adding a param note can circumvent this.

```js
/**
 * @param {number} n
 */
function toHexStr(n) {
  var s = "",
    v;
  for (var i = 7; i >= 0; i--) {
    v = (n >>> (i * 4)) & 0xf;
    s += v.toString(16);
  }
  return s;
}
```

### When do I need to add an `@returns`?

Most editors that support JSDoc can interpret the return value without the need for `@returns`. If the editor can't interpret that, you should add an `@returns`.
