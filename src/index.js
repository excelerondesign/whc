// @ts-check
/*!
 * WeHateCaptchas Self-Instantiating-Plugin
 * (c) 2020 Exceleron Designs, MIT License, https://excelerondesigns.com
 */

import emitter from './includes/emit';
import worker from './includes/worker';

(function (w) {
	const e = emitter();
	/** @type {import("./types").whcOptions} */
	const config = Object.assign(
		{
			button: '[type="submit"]',
			form: '.whc-form',
			difficulty: 3,
			finished: 'Submit',
			events: true,
			perf: false,
			// @ts-ignore
		},
		...(w.whcConfig || {})
	);

	/** @type {NodeListOf<HTMLFormElement>} */
	const forms = document.querySelectorAll(config.form);

	/**
	 * A weird bug in firefox leads to web workers with no "Active reference" to be garbage collected
	 * So we create a global array to push workers into so that they don't get collected
	 * once the workers complete their job, they are splice from the array
	 * and terminated
	 */
	// @ts-ignore
	w.whcWorkers = [];

	config.events &&
		e.on('*', (type, detail) =>
			detail.form.dispatchEvent(new CustomEvent(type, { detail }))
		);

	/** @type {(target: HTMLElement, str: string) => string | number}*/
	function getSetting(target, str) {
		if (str in target.dataset === false) return config[str];
		var value = target.dataset[str];
		var num = +value; // coerces value into a number

		return isNaN(num) || num !== num ? value : num;
	}

	/**
	 * @param {HTMLFormElement} form
	 * @param {number} i
	 */
	var Constructor = function (form, i) {
		/** @type {HTMLButtonElement} */
		const button = form.querySelector(config.button);

		const difficulty = getSetting(button, 'difficulty');

		const finished = getSetting(button, 'finished');

		/** @type {import('./types').eventInterface} */
		const eventDefault = {
			event: 'whc:Update#' + i,
			form,
			difficulty,
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
			const time = +new Date();
			this.whcWorkers[i] = createWorker(worker);

			this.whcWorkers[i].addEventListener('message', workerHandler);
			this.whcWorkers[i].postMessage({
				difficulty,
				time,
			});
			e.run(
				'whc:Start#' + i,
				merge({
					event: 'whc:Start#' + i,
				})
			);
		}

		/** @type { (event: import('./types').eventInterface) => void } */
		function appendVerification({ form, verification }) {
			const input = document.createElement('input');
			input.setAttribute('type', 'hidden');
			input.setAttribute('name', 'captcha_verification');
			input.setAttribute('value', JSON.stringify(verification));
			form.appendChild(input);
			button.classList.add('done');
			button.removeAttribute('disabled');
			button.setAttribute('value', '' + finished);
			// @ts-ignore
			w.whcWorkers[i].terminate();
		}

		/**
		 * @param {object} param
		 * @param {HTMLButtonElement} param.button
		 * @param {string} param.message
		 */
		function updatePercent({ button, message }) {
			const percent = message.match(/\d{2,3}/);
			if (!percent) return;

			button.setAttribute('data-progress', percent + '%');
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
						button,
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
