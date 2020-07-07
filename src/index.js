/*!
 * WeHateCaptchas Self-Instantiating-Plugin
 * (c) 2020 Exceleron Designs, MIT License, https://excelerondesigns.com
 */

/**
 * @typedef {Object} whcOptions
 * @prop {string} button - Valid querySelector string
 * @prop {string} form - Valid className string
 * @prop {number} difficulty - Number of "questions" to answer
 * @prop {string} finished - Final value after all questions are solved
 * @prop {boolean} events - Should emit custom events?
 * @prop {boolean} perf - Should track performance?
 */

import emit from './includes/emit';
import worker from './includes/worker';
import { pComplete } from './includes/performance';

(function () {
	/**
	 * A weird bug in firefox leads to web workers with no "Active reference" to be garbage collected
	 * So we create a global array to push workers into so that they don't get collected
	 * once the workers complete their job, they are splice from the array
	 * and terminated
	 */
	var workerArr = [];
	window.whcWorkers = workerArr;

	/** @type {whcOptions} */
	var whcDefaults = {
		button: '[type="submit"]',
		form: '.whc-form',
		difficulty: 3,
		finished: 'Submit',
		events: true,
		perf: false,
	};

	/** @type {whcOptions} */
	var windowWhcConfig = window.whcConfig || {};

	/** @type {whcOptions} */
	var whcConfig = Object.assign(whcDefaults, windowWhcConfig);

	/** @type {NodeListOf<HTMLFormElement>} */
	var forms = document.querySelectorAll(whcConfig.form);

	/** @param {string} str */
	var parse = function (str) {
		var num = parseInt(str);

		if (isNaN(num)) return false;
		if (num !== num) return false;

		return num;
	};

	/**
	 * @param {HTMLFormElement} form
	 * @param {number} index
	 */
	var Constructor = function (form, index) {
		var Private = {};

		/** @type {number} Now converted to seconds */
		Private.time = Math.floor(Date.now() / 1000);

		/** @type {HTMLFormElement} */
		Private.form = form;

		/** @type {string} */
		Private.ID = form.getAttribute('id') || 'Form ' + index;

		/** @type {HTMLButtonElement} */
		Private.button = form.querySelector(whcConfig.button);

		Private.finished =
			Private.button.dataset.finished || whcConfig.finished;

		/** @type {number} */
		Private.difficulty =
			parse(Private.button.getAttribute('data-difficulty')) ||
			whcConfig.difficulty;
		var whcStart = 'whc:Start#' + index;
		var whcUpdate = 'whc:Update#' + index;
		var whcComplete = 'whc:Complete#' + index;

		/** @param {HTMLButtonElement} button */
		var enableButton = function (button, finished) {
			button.classList.add('done');
			button.removeAttribute('disabled');
			button.setAttribute('value', finished);
		};

		/** @param {Function} func */
		var createWorker = function (func) {
			try {
				// generates a worker by converting  into a string and then running that function as a worker
				var blob = new Blob(['(' + func.toString() + ')();'], {
					type: 'application/javascript',
				});
				var blobUrl = URL.createObjectURL(blob);
				var laborer = new Worker(blobUrl);
				return laborer;
			} catch (e1) {
				throw new Error('Unknown Error: ' + e1);
			}
		};

		/**
		 * @param {Worker[]} workerArr
		 * @param {Worker} worker
		 */
		var removeWorker = function (workerArr, worker) {
			worker.terminate();
			var workerIndex = workerArr.indexOf(worker);
			workerArr.splice(workerIndex, 1);
		};

		var beginVerification = function () {
			var { events, perf } = whcConfig;
			var { difficulty, time, form } = Private;
			var laborer = createWorker(worker);
			workerArr.push(laborer);
			laborer.addEventListener('message', workerMessageHandler, false);
			laborer.postMessage({
				difficulty,
				time,
			});
			if (events)
				emit(
					form,
					'whc:Start',
					{
						time,
						difficulty,
						complete: false,
						emoji: '🚗💨',
					},
					perf,
					{ name: whcStart, method: 'mark' }
				);
		};

		/**
		 * @param {HTMLFormElement} form
		 * @param {import('./includes/worker.js').Verification} verification
		 */
		var appendVerification = function (form, verification) {
			var { events, perf } = whcConfig;
			var input = document.createElement('input');
			input.setAttribute('type', 'hidden');
			input.setAttribute('name', 'captcha_verification');
			input.setAttribute('value', JSON.stringify(verification));
			form.appendChild(input);
			if (events)
				emit(
					form,
					'whc:Complete',
					{
						verification: verification,
						done: true,
						emoji: '✅',
						perf: pComplete(index),
					},
					perf,
					{ name: whcComplete, method: 'measure', start: whcStart }
				);
		};

		/**
		 * @param {HTMLFormElement} form
		 * @param {HTMLButtonElement} button
		 * @param {string} string
		 */
		var updatePercent = function (form, button, string) {
			var { events, perf } = whcConfig;
			var percent = string.match(/\d{2,3}/);
			if (percent === null) {
				if (events)
					emit(
						form,
						'whc:Update',
						{
							emoji: '⏱',
						},
						perf,
						{ name: whcUpdate, method: 'measure', start: whcStart },
						{ name: whcUpdate, method: 'mark' }
					);
				return;
			}
			button.setAttribute('data-progress', percent + '%');
			if (events)
				emit(
					form,
					'whc:Update',
					{
						progress: percent + '%',
						done: percent[0] === '100',
						emoji: '🔔',
					},
					perf,
					{ name: whcUpdate, method: 'measure', start: whcUpdate }
				);
		};

		/**
		 * @this {Worker}
		 * @param {Object} param
		 * @param {import('./includes/worker.js').WorkerResponse} param.data
		 */
		var workerMessageHandler = function ({ data }) {
			var { form, button, finished } = Private;
			var { action, message, verification } = data;

			if (action === 'captchaSuccess') {
				appendVerification(form, verification);
				enableButton(button, finished);
				removeWorker(workerArr, this);
				return;
			}
			if (action === 'message') {
				updatePercent(form, button, message);
				return;
			}
		};

		window.addEventListener('load', beginVerification, {
			once: true,
			capture: true,
		});
	};

	forms.forEach((form, i) => new Constructor(form, i));
})();
