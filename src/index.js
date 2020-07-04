/*!
 * WeHateCaptchas Self-Instantiating-Plugin
 * (c) 2020 Exceleron Designs, MIT License, https://excelerondesigns.com
 */

/**
 * @typedef {Object} whcOptions
 * @property {string} button - Valid querySelector string
 * @property {string} form - Valid className string
 * @property {boolean} debug - Boolean to control debug messaging
 * @property {number} difficulty - Number of "questions" to answer
 * @property {string} finished - Final value after all questions are solved
 */

/**
 * @typedef {Object} Verification
 * @property {number} nonce
 * @property {string} hash
 * @property {string} question
 */

/**
 * @typedef {Object} WorkerResponse
 * @property {string} action
 * @property {string} message
 * @property {number} difficulty
 * @property {number} time
 * @property {Verification[]} verification
 */

import worker from './includes/worker';

(function () {

    /**
     * @type {whcOptions} whcDefaults
     */
    var whcDefaults = {
        button: '[type="submit"]',
        form: '.whc-form',
        debug: false,
        difficulty: 3,
        finished: 'Submit',
    }

    /**
     * @type {whcOptions} window.whcConfig
     */
    var whcConfig = Object.assign(whcDefaults, window.whcConfig ?? {});

    /**
     * @type {NodeListOf<HTMLFormElement>} forms
     */
    var forms = document.querySelectorAll(whcConfig.form);

    /**
     * @param {string} str 
     */
    var parse = function (str) {
        var num = parseInt(str);

        if (isNaN(num)) return false;
        if (num !== num) return false;

        return num;
    }

    /**
     * 
     * @param {HTMLFormElement} form 
     * @param {number} index 
     */
    var Constructor = function (form, index) {
        var Private = {};

        /**
         * @type {number} Now converted to seconds
         */
        Private.time = Math.floor(Date.now() / 1000);

        /**
         * @type {HTMLFormElement}
         */
        Private.form = form;

        /**
         * @type {string}
         */
        Private.ID = form.getAttribute("id") || "Form " + index;

        /**
         * @type {HTMLButtonElement}
         */
        Private.button = form.querySelector(whcConfig.button);

        /**
         * @type {number}
         */
        Private.difficulty = parse(Private.button.getAttribute('data-difficulty')) || whcConfig.difficulty;

        /**
         * @type {string}
         */
        Private.eventName = "WHC|" + Private.ID;

        if (whcConfig.debug) {
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

        /**
         * @param {string} detail 
         */
        var emit = function (detail) {
            if (!whcConfig.debug) return;
            window.dispatchEvent(new CustomEvent(Private.eventName, { detail }));
        };

        emit("Constructing");

        /**
         * @param {HTMLButtonElement} button 
         */
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
                throw new Error('Uknown Error: ' + e1);
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

        /**
         * 
         * @param {HTMLFormElement} form 
         * @param {Verification} verification 
         */
        var addVerification = function (form, verification) {
            var input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', 'captcha_verification');
            input.setAttribute('value', JSON.stringify(verification));
            form.appendChild(input);
        }

        /**
         * 
         * @param {HTMLButtonElement} button 
         * @param {string} string 
         */
        var updatePercent = function (button, string) {
            var percent = string.match(/\d*%/);
            if (percent === null) return;

            button.setAttribute('data-progress', percent);
            emit("Verification Progress: " + percent);
        }


        /**
         * 
         * @param {Object} param
         * @param {WorkerResponse} param.data
         */
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
