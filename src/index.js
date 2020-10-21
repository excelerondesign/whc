// @ts-check
/*!
 * WeHateCaptchas Self-Instantiating-Plugin
 * (c) 2020 Exceleron Designs, MIT License, https://excelerondesigns.com
 */

import emitter from './includes/emit';
import worker from './includes/worker';
import { sha256, Utilities } from './includes/sha256';
import getSettings from './includes/get-settings';

(function (w) {
	const e = emitter();

	/** @type {NodeListOf<HTMLFormElement>} */
	const forms = document.querySelectorAll('[data-whc]');

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

		function createWorker() {
			try {
				// converts hashing prototypes into a string version and then exports it to a web worker
				const blob = new Blob(
					[
						`
					${Utilities};
					Utilities.prototype = ${JSON.stringify(Utilities.prototype)};
					Utilities.prototype._toHexString = ${Utilities.prototype._toHexString};
					Utilities.prototype._ROTR = ${Utilities.prototype._ROTR};
					Utilities.prototype._Sigma0 = ${Utilities.prototype._Sigma0};
					Utilities.prototype._Sigma1 = ${Utilities.prototype._Sigma1};
					Utilities.prototype._sigma0 = ${Utilities.prototype._sigma0};
					Utilities.prototype._sigma1 = ${Utilities.prototype._sigma1};
					Utilities.prototype._Ch = ${Utilities.prototype._Ch};
					Utilities.prototype._Maj = ${Utilities.prototype._Maj};
					${sha256};
					sha256.prototype = Object.assign({}, Utilities.prototype);
					const sha = new sha256();
					(${worker})()`.trim(),
					],
					{
						type: 'application/javascript',
					}
				);
				const blobUrl = URL.createObjectURL(blob);
				return new Worker(blobUrl);
			} catch (e) {
				throw new Error('Unknown Error: ' + e);
			}
		}

		function verify() {
			form.__worker = createWorker();

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
			delete form.__worker;
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
