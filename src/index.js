/*!
 * WeHateCaptchas Self-Instantiating-Plugin
 * (c) 2020 Exceleron Designs, MIT License, https://excelerondesigns.com
 */
import worker from './includes/worker';

(function () {
	const script = document.getElementById('whcScriptTag');

	const forms = Array.from(
		document.getElementsByClassName(script.dataset.form),
	);

	var Constructor = function (form, index) {
		// now converted to seconds
		const time = Math.floor(Date.now() / 1000),
			eventName = 'WHC|' + (form.getAttribute('id') || 'Form ' + index),
			// should be a class selector
			// each button should also have a 'data-finished' text that the button should end on
			// This defaults to a search of the whole document,
			button =
				form.getElementsByClassName(script.dataset.button)[0] ||
				document.getElementsByClassName(script.dataset.button)[0],
			difficulty = parseInt(button.dataset.difficulty) || 5;

		// converts the debug value into a boolean,
		// so truthy becomes Boolean true, and Falsy becomes Boolean false
		// (https://developer.mozilla.org/en-US/docs/Glossary/Truthy - https://developer.mozilla.org/en-US/docs/Glossary/Falsy)
		// checks all the forms to see if any of them have the debug flag, and then checks if it is true

		var emit = function () {};
		if ('debug' in form.dataset) {
			window.WHCDetails = window.WHCDetails || [];
			window.WHCDetails.push({
				form,
				button,
				difficulty,
			});
			window.addEventListener(
				eventName,
				({ detail }) =>
					console.log(eventName + '::Message -> ' + detail),
				false,
			);
			emit = function (detail) {
				const evt = new CustomEvent(eventName, {
					detail,
				});
				window.dispatchEvent(evt);
			};
		}

		emit('Constructing');

		// var publicAPIs = {};

		var enableButton = function (button) {
			button.classList.add('done');
			button.disabled = false;
			button.value = button.dataset.finished;
		};

		var createWorker = function () {
			var employee = null;
			try {
				var blob = new Blob(
					// generates a worker by converting  into a string and then running that function as a worker
					['(' + worker.toString() + ')();'],
					{ type: 'application/javascript' },
				);
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

		internalWorker = createWorker();

		var beginVerification = function () {
			emit('Difficulty Level: ' + difficulty);
			sendRequest('https://wehatecaptchas.com/api.php').then(function (
				data,
			) {
				const { question } = data.data;
				internalWorker.postMessage({
					question: question,
					time,
					difficulty: difficulty,
				});

				emit('beginVerification: Request Sent');
			});
		};

		var sendRequest = async function (url) {
			var formData = new FormData();

			formData.append('endpoint', 'question');

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
				form.insertAdjacentHTML(
					'beforeend',
					`<input type="hidden" name="captcha_verification" value='${JSON.stringify(
						data.verification,
					)}'/>`,
				);

				enableButton(button);

				return;
			} else if (data.action === 'message') {
				var percent = data.message.match(/\d*%/);
				if (percent === null) return;
				button.dataset.progress = percent;
				emit('workerMessageHandler: Progress ' + percent);
				return;
			}
			emit('workerMessageHandler: ERROR - UNKNOWN');
		};

		window.addEventListener('load', beginVerification, {
			once: true,
			capture: true,
		});

		internalWorker.addEventListener('message', workerMessageHandler, false);

		emit('Constructed');
	};

	forms.forEach((form, i) => new Constructor(form, i));
})();
