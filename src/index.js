// @ts-check
/*!
 * WeHateCaptchas Self-Instantiating-Plugin
 * (c) 2020 Exceleron Designs, MIT License, https://excelerondesigns.com
 */

import emitter from './includes/emit';
import worker from './includes/worker';
import getSettings from './includes/get-settings';

(function (w) {
	const e = emitter();

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

		if (debug) {
			/**
			 * @param {string} type
			 * @param {object} detail
			 */
			const allEmit = (type, detail) =>
				detail.form.dispatchEvent(new CustomEvent(type, { detail }));
			// TODO: Change this so that it doesn't do ALL forms, just the ones that have debug
			e.on('*', allEmit);
		}
		/** @type {import('./types').eventInterface} */
		const eventDefault = {
			event: 'whc:Update#' + i,
			difficulty,
			form,
			verification: [],
			progress: 0,
			done: false,
		};

		/** @type { ( obj:import('./types').eventInterface ) => object } */
		const merge = obj => Object.assign(eventDefault, obj);

		/** @param {Function} fn */
		function createWorker(fn) {
			try {
				// generates a worker by converting into a string and then running that function as a worker
				const blob = new Blob(['(' + fn.toString() + ')();'], {
					type: 'application/javascript',
				});
				const blobUrl = URL.createObjectURL(blob);
				return new Worker(blobUrl);
			} catch (e) {
				throw new Error('Unknown Error: ' + e);
			}
		}

		function verify() {
			form.__worker = createWorker(worker);

			form.__worker.addEventListener('message', workerHandler);
			form.__worker.postMessage({
				difficulty,
				time: Date.now(),
			});
			e.run(
				'whc:Start#' + i,
				merge({
					event: 'whc:Start#' + i,
				})
			);
		}

		/** @type { (event: import('./types').eventInterface) => void } */
		function appendVerification({ verification }) {
			// prettier-ignore
			form.insertAdjacentHTML('beforeend', `<input type="hidden" name="captcha_verification" value='${JSON.stringify(verification)}' />`);
			button.classList.add('done');
			button.removeAttribute('disabled');
			button.setAttribute('value', '' + finished);
			// @ts-ignore
			form.__worker.terminate();
		}

		/**
		 * @param {object} param
		 * @param {HTMLButtonElement} param.button
		 * @param {string} param.message
		 */
		function updatePercent({ message }) {
			const percent = message.match(/\d{2,3}/);
			if (!percent) return;

			form.dataset.progress = percent + '%';
			e.run(
				'whc:Progress#' + i,
				merge({
					event: 'whc:Progress#' + i,
					progress: +percent[0],
					done: +percent[0] === 100,
				})
			);
		}

		e.on('whc:Update#' + i, updatePercent);
		e.on('whc:Complete#' + i, appendVerification);

		/**
		 * @this {Worker}
		 * @param {object} param
		 * @param {import('./types').WorkerResponse} param.data
		 */
		function workerHandler({ data }) {
			const { action, message, verification } = data;

			if (action === 'captchaSuccess') {
				return e.run(
					'whc:Complete#' + i,
					merge({
						event: 'whc:Complete#' + i,
						verification,
						done: true,
						progress: 100,
					})
				);
			}
			if (action === 'message') {
				return e.run(
					'whc:Update#' + i,
					merge({
						event: 'whc:Completed#' + i,
						message,
						progress: 0,
					})
				);
			}
		}

		w.addEventListener('load', verify, {
			once: true,
			capture: true,
		});
	};

	forms.forEach((form, i) => new Constructor(form, i));
})(window);
