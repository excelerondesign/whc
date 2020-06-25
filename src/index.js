/*!
 * WeHateCaptchas Self-Instantiating-Plugin
 * (c) 2020 Exceleron Designs, MIT License, https://excelerondesigns.com
 */
import worker from './includes/worker';
import sha256 from './includes/crypto';
(function () {
    const script = document.getElementById("whcScriptTag");

    const forms = Array.from(document.getElementsByClassName(script.dataset.form));
    console.log(forms);
    var Constructor = function (form, index) {
        const Private = {};

        // now converted to seconds
        Private.time = Math.floor(Date.now() / 1000);

        // current time + 1 hour;
        Private.ttl = Private.time + 3600;
        //// Checks if there is a form or if there is an
        //// Private.form = document.getElementById(script.dataset.form);
        // use a unique class selector for the forms
        Private.form = form;
        console.log(form)
        Private.ID = Private.form.getAttribute("id") || "Form " + index;
        // should be a class selector
        // each button should also have a 'data-finished' text that the button should end on
        Private.button = Private.form.getElementsByClassName(
            script.dataset.button
        )[0];
        // find the average difficulty of all the buttons on the page or use five

        Private.difficulty = parseInt(Private.button.dataset.difficulty) || 5;

        Private.eventName = "WHC|" + Private.ID + "::Message -> ";

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
                ({ detail }) => console.log(Private.eventName + detail),
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
            var employee = null;
            try {
                var blob = new Blob(
                    // generates a worker by converting  into a string and then running that function as a worker
                    ['(' + worker.toString() + sha256.toString() + ')();'], { type: 'application/javascript' });
                var url = window.URL || window.webkitURL;
                var blobUrl = url.createObjectURL(blob);
                employee = new Worker(blobUrl);
            } catch (e1) {
                emit('createWorker: Worker Error');
                //if it still fails, there is nothing much we can do
                console.error(e1);
            }
            emit('createWorker: Worker Created');
            return employee;
        };

        // function(){importScripts("https://wehatecaptchas.com/sha256.js");const getWholePercent=(e,i)=>Math.floor(e/i*100),isPrime=e=>{for(var i=2;i<e;i++)if(e%i==0)return!1;return e>1},solveCaptcha=(e,i=1)=>{i++;for(var s={question:e.question,time:e.time,nonce:i},t=JSON.stringify(s),a=sha256(t);"0000"!==a.substr(0,4)||!isPrime(i);){i++;s={question:e.question,time:e.time,nonce:i},t=JSON.stringify(s),a=sha256(t)}return{verify_array:s,nonce:i,hash:a}};var verification=[];if(null===nonce)var nonce=1;self.addEventListener("message",(function(e){var i=e.data;self.postMessage({action:"message",message:"Checking if you're a bot before enabling submit button..."});for(var s,t,a=i.difficulty,n=0;n<a;n++){var r=solveCaptcha(i,o),o=r.nonce;verification.push(r.verify_array);var c=(s=n+1,t=a,Math.floor(s/t*100));self.postMessage({action:"message",message:`Still checking... ${c}% done`})}self.postMessage({action:"captchaSuccess",verification:verification}),verification=[],o=1}),!1);}

        Private.worker = createWorker();


        var beginVerification = function () {
            var difficulty = Private.difficulty;

            emit("Difficulty Level: " + difficulty);
            sendRequest("https://wehatecaptchas.com/api.php").then(function (data) {
                const { question } = data.data;
                Private.worker.postMessage({
                    question: question,
                    time: Private.time,
                    difficulty: difficulty
                });

                emit("beginVerification: Request Sent");
            });
        };

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

        var workerMessageHandler = function ({ data }) {
            if (data.action === "captchaSuccess") {
                Private.form.insertAdjacentHTML(
                    "beforeend",
                    `<input type="hidden" name="captcha_verification" value="${JSON.stringify(
                        data.verification
                    )}"/>`
                );
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
