# Contributing

These are some of the basic guidelines you should follow while developing this plugin. While none of us are in grade school any more, these are made to make all of our lives easier even if they seem like a hassle at first.

[Types](/#types)

## Types

---

This project takes advantage of [JSDoc](https://jsdoc.app/index.html) to comment and record functions, parameters, and classes. Editors that support JSDoc automatically read/interpret comments and turn it into TypeScript like documentation, which gives everyone access to safer code without the steep learning curve and config fatigue that Typescript has.

#### When do I need to add an `@typedef`?

Probably not at all. At the time of writing (5/4/2020), there are 4.

- WorkerResponse
- Verification
- whcOptions
- EncodedMessage

These `@typedef` are used because they represent large objects or objects that return complex variables.

Example:

```js
EncodedMessage.M = number[][]; // Array -> Array -> number

WorkerResponse.verification = Verifcation[] // Array -> Verification{ nonce: number, time: number, question: string }
```

If you are running into a large object/complex variable, it may be a sign that the code needs to be reevaluated.

#### When do I need to add an `@param`?

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

#### When do I need to add an `@returns`?

Most editors that can interpret JSDoc can figure out what most functions returns. Most. Here's an example.

```js
function setButtonPercent(button, string) {
  var percent = string.match(/\d*%/);
  if (percent === null) return;

  button.setAttribute("data-progress", percent);
}
```

With explicit function and parameter names, it is easy to see what these should be. An editor interpreting/using JSDoc would say the parameters are of type "any" and returns "void" as it does not use a `return` statement. The function below though uses `this`, and is losing some context about what the functions `encodeMessage` and `computeHash` return.

Adding those comments helps clear up that confusion.

```js
/**
 * @param {(string|number)} msg
 * @returns {string}
 */
obscureClass.hashMessage(msg) {
	const encodedMessage = this.encodeMessage(msg);
	const intermediateHash = this.computeHash(encodedMessage, this.H, this.K);
	const hashedString = intermediateHash.join(''); // does not have an inherent type attached
	return hashedString;
};
```

Now when `hashMessage` is called, it will tell us to pass in a string/number and to expect a string in response.

####
