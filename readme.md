# About

WeHateCaptchas is a form verification service created by [Edward Dalton](DaltonWebDev), now maintained by [Cohan Robinson](https://github.com/cohan) designed to "timeout" bots, rather than out think them. Examples here: [HTML](https://gist.github.com/cohan/baf91e94c3a82cdb66f7044520ab2789#file-wehatecaptchas-html), [PHP](https://gist.github.com/cohan/ed5345ec260d1c3a684857c5cf387ccf#file-wehatecaptchas-php)

Here we've altered the Javascript aspect from the example to add some extra benefits.

-   Support for multiple forms
-   Advanced debugging (per form)
    -   Logging verification steps
    -   Details object

# Documentation

To include in a project, upload or copy `dist/whc-plugin.umd.js` or `dist/min/whc-plugin.umd.js` to your project, and add the necessary parameters below.

## Options

-   `form` ( default: `.whc-form` ) Marker class for all forms to be verified on the page

-   `button` ( default: `.whc-button` ) Marker class for button/input, extra `data-*` attributes can be added here for form specific settings

-   `debug` ( default: `false` ) Boolean to turn on/off extra debugging during the verification process. Can also be set on the form using the `data-debug` attribute.

-   `difficulty` ( default: `3` ) The number of "questions" to answer before marking a form as verified. Can also be set on the button/input using the `data-difficulty` attribute.

-   `finished` ( default: `Submit`) The button text/input value after verification is done. Can also be set on the button/input using the `data-finished` attribute.

#### Automatic data attributes

`data-progress`: Visual representation of the verification progress

### Debug Additions

When `debug` is set to `true`, there are a few additions that are made.

First, messages are logged to the console for every step along the way. Specifically:

-   Constructor: Start and Complete
-   Creating Worker: Start, Complete, and Error
-   Verification: Message Sent, Progress xx%, and Progress Complete
-   Message Handler: Error

Second, it creates `window.whcDetails` an array of all the forms being verified. This can be helpful for getting a bird's eye view.
