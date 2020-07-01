/*!
 * WeHateCaptchas Self-Instantiating-Plugin
 * (c) 2020 Exceleron Designs, MIT License, https://excelerondesigns.com
 */
import worker from './includes/worker';

(function () {
    const script = document.getElementById("whcScriptTag");

    const forms = Array.from(document.getElementsByClassName(script.dataset.form));

    var Constructor = function (form, index) {
        const Private = {};

        // now converted to seconds
        Private.time = Math.floor(Date.now() / 1000);

        // current time + 1 hour;
        // Private.ttl = Private.time + 3600;

        Private.form = form;

        Private.ID = Private.form.getAttribute("id") || "Form " + index;
        // should be a class selector
        // each button should also have a 'data-finished' text that the button should end on
        Private.button = Private.form.getElementsByClassName(
            script.dataset.button
        )[0];

        Private.difficulty = parseInt(Private.button.dataset.difficulty) || 5;

        Private.eventName = "WHC|" + Private.ID;

        // converts the debug value into a boolean,
        // so truthy becomes Boolean true, and Falsy becomes Boolean false
        // (https://developer.mozilla.org/en-US/docs/Glossary/Truthy - https://developer.mozilla.org/en-US/docs/Glossary/Falsy)
        // checks all the forms to see if any of them have the debug flag, and then checks if it is true
        Private.debug =
            "debug" in Private.form.dataset && Boolean(Private.form.dataset.debug);

        if (Private.debug) {
            localStorage.removeItem("WHCStorage");
            window.WHCDetails = window.WHCDetails || [];
            window.WHCDetails.push({
                form,
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
            if (!Private.debug) return;
            window.dispatchEvent(new CustomEvent(Private.eventName, { detail }));
        };

        emit("Constructing");

        // var publicAPIs = {};

        var enableButton = function (button) {
            button.classList.add("done");
            button.disabled = false;
            button.value = button.dataset.finished;
        };

        var createWorker = function () {
            try {
                // generates a worker by converting  into a string and then running that function as a worker
                var blob = new Blob(['(' + worker.toString() + ')();'], { type: 'application/javascript' });
                var blobUrl = URL.createObjectURL(blob);
                var laborer = new Worker(blobUrl);
                emit('createWorker: Worker Created');
                return laborer;
            } catch (e1) {
                emit('createWorker: Worker Error');
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

            emit("beginVerification: Message Sent");
        };
        /*
        var sendRequest = async function (url) {
            var formData = new FormData();

            formData.append("endpoint", "question");

            let response = await fetch(url, {
                method: "POST",
                body: formData
            });

            let data = await response.json();
            emit("sendRequest: Response Received");
            return data;
        };
        */
        var addVerification = function (form, verification) {
            var input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', 'captcha_verification');
            input.setAttribute('value', JSON.stringify(verification));
            form.appendChild(input);
        }

        var workerMessageHandler = function ({ data }) {
            if (data.action === "captchaSuccess") {

                addVerification(Private.form, data.verification);

                enableButton(Private.button);

                return;
            } else if (data.action === "message") {
                var percent = data.message.match(/\d*%/);
                if (percent === null) return;
                Private.button.dataset.progress = percent;
                emit("workerMessageHandler: Progress " + percent);
                return;
            }
            emit("workerMessageHandler: ERROR - UNKNOWN");
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
