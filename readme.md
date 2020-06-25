# Documentation

To include in a project, upload or copy `whc.umd.js` to your project, and add the necessary parameters below.

## Parameters

### HTMLScriptElement

`id` = `whcScriptTag` _required_

_use getElementsByClassName_
`data-form` a class name for the forms on the page.

`data-button` a class name for the submit buttons/inputs on the page.

---

### HTMLFormElement

`data-debug`: A boolean for getting more information about what is going on behind the scenes. Accepted values are any `Integer`, `'true'` or `'false'`, `''`.

While you can use `'false'`, it is an anti-pattern and should be avoided in production.

### HTMLButtonElement or HTMLInputElement

`data-difficulty`: A number between 1 - 10. Determines the number of "questions" to answer before marking the user as verified.

`data-finished`: The text/value of the element after verified.

#### Automatic data attributes

`data-progress`: Visual representation of the verification progress

### Internal Variables

_Private.time_ The time the verification starts
_Private.ttl_ Private.time + 1 hour
_Private.script_ The script element
_Private.forms_ Array of all forms on the page
_Private.buttons_ Array of all buttons/inputs
_Private.difficulty_ The difficulty of the verification process, either the default (5), the `data-difficulty` of the only button/input on the page, or an average of all on the page.
_Private.eventName_ Internal event name for debugging
_Private.workerFunc_ Inline WebWorker function
_Private.worker_ The WebWorker after it is creater
_Private.debug_ A function that checks all the forms for a debug value, turns on extra debugging features if true

### Globals

To limit Global variables, if _Private.debug_ is true, it will add `window.WHCDetails` with an object including all the forms, buttons, and the current difficulty.
