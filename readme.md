# About

WeHateCaptchas is a form verification service created by [Edward Dalton](DaltonWebDev), now maintained by [Cohan Robinson](https://github.com/cohan) designed to "timeout" bots, rather than out think them. Examples here: [HTML](https://gist.github.com/cohan/baf91e94c3a82cdb66f7044520ab2789#file-wehatecaptchas-html), [PHP](https://gist.github.com/cohan/ed5345ec260d1c3a684857c5cf387ccf#file-wehatecaptchas-php)

Here we've altered the Javascript aspect from the example to add some extra benefits.

-   Support for multiple forms
-   Advanced debugging (per form)
    -   Logging verification steps
    -   Details object

# Documentation

To include in a project, upload or copy `dist/whc-plugin.umd.js` to your project, and add the necessary parameters below.

_If you only need to support more modern browsers, you can use the js inside of `dist/whc-plugin.modern.js`_

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
_Private.script_ The script element
_Private.form_ Current form
_Private.button_ Current submit button
_Private.difficulty_ The difficulty of the verification process, either the default (5), the `data-difficulty` of the only button/input on the page, or an average of all on the page.
_Private.eventName_ Internal event name for debugging
_Private.workerFunc_ Inline WebWorker function
_Private.worker_ The WebWorker after it is creater
_Private.debug_ A function that checks all the forms for a debug value, turns on extra debugging features if true

### Globals

To limit Global variables, if _Private.debug_ is true, it will add `window.WHCDetails` with an object including all the forms, buttons, and the current difficulty.
