// @ts-check
/*!
 * WeHateCaptchas Self-Instantiating-Plugin
 * (c) 2020 Exceleron Designs, MIT License, https://excelerondesigns.com
 */
import Log from './includes/log';
import worker from './includes/worker';
import getSettings from './includes/get-settings';

(function (w) {
	/** @type {NodeListOf<HTMLFormElement>} */
	const forms = document.querySelectorAll('[data-whc]');

	/**
	 * A weird bug in firefox leads to web workers with no "Active reference" to be garbage collected
	 * So we create a global array to push workers into so that they don't get collected
	 * once the workers complete their job, they are splice from the array
	 * and terminated
	 */
	// @ts-ignore
	w.whcWorkers = [];
	/**
	 * @param {HTMLFormElement} form
	 * @param {number} i
	 */
	var Constructor = function (form, i) {
		// TODO: implement the eventName into the pubsub system
		const { button, difficulty, finished, debug } = getSettings(form);
		const log = debug ? Log(form) : {};
		/** @param {Function} fn */
		function createWorker(fn) {
			try {
				// generates a worker by converting into a string and then running that function as a worker
				const blob = new Blob(['(' + fn.toString() + ')();'], {
					type: 'application/javascript',
				});
				const blobUrl = URL.createObjectURL(blob);
				log.info = {
					title: 'Worker Created',
				};
				return new Worker(blobUrl);
			} catch (e) {
				// @ts-ignore
				log.error = {
					title: 'Unknown Error',
					error: e,
				};
				throw new Error('Unknown Error: ' + e);
			}
		}

		function verify() {
			const time = +new Date();
			this.whcWorkers[i] = createWorker(worker);

			this.whcWorkers[i].addEventListener('message', workerHandler);
			this.whcWorkers[i].postMessage({
				difficulty,
				time,
			});
		}

		/** @type { (verification: import('./types').Verification[]) => void } */
		function appendVerification(verification) {
			// prettier-ignore
			form.insertAdjacentHTML('beforeend', `<input type="hidden" name="captcha_verification" value='${JSON.stringify(verification)}' />`);
			button.classList.add('done');
			button.removeAttribute('disabled');
			button.setAttribute('value', '' + finished);
			// @ts-ignore
			log.info = {
				title: 'Verified Form',
				verification,
			};
			// @ts-ignore
			w.whcWorkers[i].terminate();
		}

		/**
		 * @param {string} message
		 */
		function updatePercent(message) {
			const percent = message.match(/\d{2,3}/);
			if (!percent) return;

			form.dataset.progress = percent + '%';
			// @ts-ignore
			log.info = {
				title: 'Progress Update',
				percent: percent + '%',
			};
		}
		/**
		 * @this {Worker}
		 * @param {object} param
		 * @param {import('./types').WorkerResponse} param.data
		 */
		function workerHandler({ data }) {
			const { action, message, verification } = data;

			if (action === 'captchaSuccess') {
				return appendVerification(verification);
			}
			if (action === 'message') {
				return updatePercent(message);
			}
		}

		w.addEventListener('load', verify, {
			once: true,
			capture: true,
		});
	};

	forms.forEach((form, i) => new Constructor(form, i));
})(window);
