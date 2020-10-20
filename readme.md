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

### HTMLFormElement

`id`: **Required** Necessary for things like event name and finding submit buttons.

`data-whc`: **Required** Marks the form as needing verification.

`data-button`: _Optional_ Add to signify use of a submit button outside the form element using [the form attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefform). Else, uses querySelector to find an element with `[type="submit"]`.

`data-difficulty`: _Optional_ An Integer between 1 - 10. Default is 5.

`data-debug`: _Optional_ Add this to get helpful console messages about the verification process. No value needed.

`data-finished`: _Optional_ The text/value of the submit button after the form has been verified. Default is "Submit".

#### Automatic data attributes

`data-progress`: Visual representation of the verification progress
