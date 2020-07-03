/*!
 * WeHateCaptchas Self-Instantiating-Plugin
 * (c) 2020 Exceleron Designs, MIT License, https://excelerondesigns.com
 */
import worker from './includes/worker';

(function () {

    const whcDefaults = {
        button: '.whc-button',
        form: '.whc-form',
        debug: false,
        difficulty: 3,
        finished: 'Submit',
    }

    const whcConfig = Object.assign(whcDefaults, window.whcConfig ?? {});

    const forms = document.querySelectorAll(whcConfig.form);


    var parse = function (str) {
        var num = parseInt(str);

        if (isNaN(num)) return false;
        if (num !== num) return false;

        return num;
    }

    var Constructor = function (form, index) {

        const Private = {};

        // now converted to seconds
        Private.time = Math.floor(Date.now() / 1000);

        // current time + 1 hour;
        // Private.ttl = Private.time + 3600;

        Private.form = form;

        Private.ID = form.getAttribute("id") || "Form " + index;
        // should be a class selector
        // each button should also have a 'data-finished' text that the button should end on
        Private.button = form.querySelector(whcConfig.button);

        Private.difficulty = parse(Private.button.getAttribute('data-difficulty')) || whcConfig.difficulty;


        if (whcConfig.debug) {
            Private.eventName = "WHC|" + Private.ID;
            window.whcDetails = window.whcDetails || [];
            window.whcDetails.push({
                form: Private.form,
                button: Private.button,
                difficulty: Private.difficulty
            });
            window.addEventListener(
                Private.eventName,
                ({ detail }) => console.log(Private.eventName + "::Message -> " + detail),
                false
            );
        }

        var emit = function (detail) {
            if (!whcConfig.debug) return;
            window.dispatchEvent(new CustomEvent(Private.eventName, { detail }));
        };

        emit("Constructing");

        var enableButton = function (button) {
            var { finished } = button.dataset;
            button.classList.add("done");
            button.removeAttribute('disabled');
            button.setAttribute('value', finished);
        };

        var createWorker = function () {
            emit('createWorker(): Creating')
            try {
                // generates a worker by converting  into a string and then running that function as a worker
                var blob = new Blob(['(' + worker.toString() + ')();'], { type: 'application/javascript' });
                var blobUrl = URL.createObjectURL(blob);
                var laborer = new Worker(blobUrl);
                emit('createWorker(): Created');
                return laborer;
            } catch (e1) {
                emit('createWorker(): Error');
                //if it still fails, there is nothing much we can do
                console.error(e1);
            }
        };

        Private.worker = createWorker();

        var beginVerification = function () {
            var { difficulty, time, worker } = Private;

            emit("Difficulty Level: " + difficulty);

            worker.postMessage({
                difficulty,
                time
            });

            emit("Verification: Message Sent");
        };

        var addVerification = function (form, verification) {
            var input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', 'captcha_verification');
            input.setAttribute('value', JSON.stringify(verification));
            form.appendChild(input);
        }

        var updatePercent = function (button, string) {
            var percent = string.match(/\d*%/);
            if (percent === null) return;

            button.setAttribute('data-progress', percent);
            emit("Verification Progress: " + percent);
        }

        var workerMessageHandler = function ({ data }) {
            if (data.action === "captchaSuccess") {

                addVerification(Private.form, data.verification);
                enableButton(Private.button);
                emit("Verification Progress: Complete");

                return;
            } else if (data.action === "message") {

                updatePercent(Private.button, data.message)
                return;
            }
            emit("Message Handler: ERROR - UNKNOWN");
        };

        window.addEventListener("load", beginVerification, {
            once: true,
            capture: true
        });

        Private.worker.addEventListener("message", workerMessageHandler, false);

        emit("Constructed");
    };

    forms.forEach((form, i) => new Constructor(form, i));
})();
