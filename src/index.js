/*!
 * WeHateCaptchas Self-Instantiating-Plugin
 * (c) 2020 Exceleron Designs, MIT License, https://excelerondesigns.com
 */
import worker from './includes/worker';
import getData from './includes/get-data';

(function () {
	var Constructor = function (form) {
		const { eventName, button, difficulty, debug } = getData(form);

		var emit = function () {};
		if (debug) {
			window.addEventListener(
				eventName,
				({ detail }) =>
					console.log(eventName + '::Message -> ' + detail),
				true,
			);
			emit = function (detail) {
				const evt = new CustomEvent(eventName, {
					detail,
				});
				window.dispatchEvent(evt);
			};
		}

		emit('Constructing');

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

		const internalWorker = createWorker();

		var beginVerification = function () {
			emit('Difficulty Level: ' + difficulty);
			sendRequest('https://wehatecaptchas.com/api.php').then(function (
				data,
			) {
				const { question } = data.data;
				internalWorker.postMessage({
					question: question,
					time: Math.floor(Date.now() / 1000),
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

				button.classList.add('done');
				button.disabled = false;
				button.value = button.dataset.finished;

				return;
			} else if (data.action === 'message') {
				var percent = data.message.match(/\d*%/);
				if (percent === null) return;
				button.dataset.progress = percent;
				emit('workerMessageHandler: Progress ' + percent);
				return;
			}
			console.error('workerMessageHandler: ERROR - UNKNOWN');
		};

		window.addEventListener('load', beginVerification, {
			once: true,
			capture: true,
		});

		internalWorker.onmessage = workerMessageHandler;

		emit('Constructed');
	};

	document
		.querySelectorAll('[data-whc]')
		.forEach((form) => new Constructor(form));
})();
