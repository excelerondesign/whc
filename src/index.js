/*!
 * WeHateCaptchas Self-Instantiating-Plugin
 * (c) 2020 Exceleron Designs, MIT License, https://excelerondesigns.com
 */
import worker from './includes/worker';
(function () {
    'use strict';

    var Constructor = function () {

        const Private = {};
        Private.time = Math.floor(Date.now() / 1000);
        Private.script = document.getElementById('whcScriptTag');
        Private.form = document.getElementById(Private.script.dataset.form);
        Private.button = document.getElementById(Private.script.dataset.button);
        Private.difficulty = Private.button.dataset.difficulty || 5;
        Private.eventName = 'WHC::Message -> ';

        Private.workerFunc = worker;

        // converts the debug value into a boolean, 
        // so truthy becomes Boolean true, and Falsy becomes Boolean false
        // (https://developer.mozilla.org/en-US/docs/Glossary/Truthy - https://developer.mozilla.org/en-US/docs/Glossary/Falsy)
        Private.debug = Boolean(Private.form.dataset.whcDebug);
        window.addEventListener(Private.eventName, ({ detail }) => console.log(Private.eventName + detail), false);

        var emit = function (detail) {
            if (!Private.debug) return;
            window.dispatchEvent(new CustomEvent(Private.eventName, { detail }));
        };

        emit('Constructing');

        var publicAPIs = {};

        var enableButton = function () {
            Private.button.classList.add('done');
            Private.button.disabled = false;
            Private.button.value = Private.button.dataset.finished;
        };

        var createWorker = function () {
            var worker = null;
            try {
                var blob = new Blob(
                    // generates a worker by converting  into a string and then running that function as a worker
                    ['(' + Private.workerFunc.toString() + ')();'], { type: 'application/javascript' });
                var url = window.URL || window.webkitURL;
                var blobUrl = url.createObjectURL(blob);
                worker = new Worker(blobUrl);
            } catch (e1) {
                emit('createWorker: Worker Error');
                //if it still fails, there is nothing much we can do
                console.error(e1);
            }
            emit('createWorker: Worker Created');
            return worker;
        };

        // function(){importScripts("https://wehatecaptchas.com/sha256.js");const getWholePercent=(e,i)=>Math.floor(e/i*100),isPrime=e=>{for(var i=2;i<e;i++)if(e%i==0)return!1;return e>1},solveCaptcha=(e,i=1)=>{i++;for(var s={question:e.question,time:e.time,nonce:i},t=JSON.stringify(s),a=sha256(t);"0000"!==a.substr(0,4)||!isPrime(i);){i++;s={question:e.question,time:e.time,nonce:i},t=JSON.stringify(s),a=sha256(t)}return{verify_array:s,nonce:i,hash:a}};var verification=[];if(null===nonce)var nonce=1;self.addEventListener("message",(function(e){var i=e.data;self.postMessage({action:"message",message:"Checking if you're a bot before enabling submit button..."});for(var s,t,a=i.difficulty,n=0;n<a;n++){var r=solveCaptcha(i,o),o=r.nonce;verification.push(r.verify_array);var c=(s=n+1,t=a,Math.floor(s/t*100));self.postMessage({action:"message",message:`Still checking... ${c}% done`})}self.postMessage({action:"captchaSuccess",verification:verification}),verification=[],o=1}),!1);}

        Private.worker = createWorker();


        var skipVerification = function () {
            var prevDiff = parseFloat(localStorage.getItem('WHCPrevDifficulty'));

            var skipVerify = !Private.debug && localStorage.getItem('WHCVerified') !== null;
            var sameDifficulty = prevDiff === prevDiff && localStorage.getItem('WHCPrevDifficulty') === Private.difficulty;

            return sameDifficulty && skipVerify;
        };

        var beginVerification = function () {
            var difficulty = Private.difficulty;

            if (skipVerification()) {
                emit('beginVerification: Already verified');
                enableButton();
                return;
            }

            sendRequest('https://wehatecaptchas.com/api.php').then(function (data) {
                Private.worker.postMessage({
                    question: data.data.question,
                    time: Private.time,
                    difficulty: difficulty,
                });
                Private.button.disabled = true;
                emit('beginVerification: Request Sent');
            });
        };

        var sendRequest = async function (url) {
            var formData = new FormData();

            formData.append('endpoint', 'question')

            let response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            let data = await response.json();
            emit('sendRequest: Response Received');
            return data;
        };

        var workerMessageHandler = function ({ data }) {
            if (data.action === 'captchaSuccess') {
                const verification = JSON.stringify(data.verification);
                Private.form.insertAdjacentHTML(
                    'beforeend',
                    `<input type="hidden" name="captcha_verification" value='${JSON.stringify(
                        data.verification
                    )}'>`
                );
                enableButton();
                emit('workerMessageHandler: Captcha Success');
                localStorage.setItem('WHCVerified', verification);
                localStorage.setItem('WHCPrevDifficulty', Private.difficulty)
                return;
            } else if (data.action === 'message') {
                var percent = data.message.match(/\d*%/);
                if (percent === null) return;
                Private.button.dataset.progress = percent;
                emit('workerMessageHandler: Progress ' + percent);
                return;
            }
            emit('workerMessageHandler: ERROR - UNKNOWN');
        };

        window.addEventListener('load', beginVerification, { once: true, capture: true });
        Private.worker.addEventListener('message', workerMessageHandler, false);

        emit('Constructed');
    };

    return new Constructor();
})();
