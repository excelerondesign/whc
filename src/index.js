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

(function (w) {
	/**
	 * A weird bug in firefox leads to web workers with no "Active reference" to be garbage collected
	 * So we create a global array to push workers into so that they don't get collected
	 * once the workers complete their job, they are splice from the array
	 * and terminated
	 */
	w.whcWorkers = [];

	/**
	 * @type {whcOptions}
	 */
	var whcConfig = Object.assign(
		{
			button: '[type="submit"]',
			form: '.whc-form',
			difficulty: 3,
			finished: 'Submit',
			events: true,
		},
		w.whcConfig || {}
	);

	/** @type {NodeListOf<HTMLFormElement>} */
	var forms = document.querySelectorAll(whcConfig.form);

	var getDataset = (target, str) => {
		if (!str in target.dataset) return false;
		var value = target.dataset[str];
		var num = parseInt(value);

		if (isNaN(num) || num !== num) return value;
		return num;
	};

	/**
	 * @param {HTMLFormElement} form
	 * @param {number} index
	 */
	var Constructor = function (form, index) {
		/**
		 * @type {HTMLButtonElement}
		 */
		const button = form.querySelector(whcConfig.button);

		/**
		 * @type {number}
		 */
		const difficulty =
			getDataset(button, 'difficulty') || whcConfig.difficulty;

		const finished = getDataset(button, 'finished') || whcConfig.finished;
		const whcStart = 'whc:Start#' + index;
		const whcUpdate = 'whc:Update#' + index;
		const whcComplete = 'whc:Complete#' + index;
		/**
		 * @param {HTMLButtonElement} button
		 */
		function enableButton(button) {
			button.classList.add('done');
			button.removeAttribute('disabled');
			button.setAttribute('value', finished);
		}

		/**
		 * @param {Function} fn
		 */
		function createWorker(fn) {
			try {
				// generates a worker by converting  into a string and then running that function as a worker
				var blob = new Blob(['(' + fn.toString() + ')();'], {
					type: 'application/javascript',
				});
				var blobUrl = URL.createObjectURL(blob);
				var laborer = new Worker(blobUrl);
				return laborer;
			} catch (e1) {
				throw new Error('Unknown Error: ' + e1);
			}
		}

		/**
		 * @param {Worker[]} workerArr
		 * @param {Worker} worker
		 */
		function removeWorker(workerArr, worker) {
			worker.terminate();
			var workerIndex = workerArr.indexOf(worker);
			workerArr.splice(workerIndex, 1);
		}

		function verify() {
			var { events, perf } = whcConfig;
			const time = Date.now();
			var laborer = createWorker(worker);
			whcWorkers.push(laborer);

			laborer.addEventListener('message', workerHandler);
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
		}

		/**
		 * @param {HTMLFormElement} form
		 * @param {import('./includes/worker.js').Verification} verification
		 */
		function appendVerification(form, verification) {
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
						progress: '100%',
					},
					perf,
					{ name: whcComplete, method: 'measure', start: whcStart }
				);
		}

		/**
		 * @param {HTMLFormElement} form
		 * @param {HTMLButtonElement} button
		 * @param {string} string
		 */
		function updatePercent(form, button, string) {
			var { events, perf } = whcConfig;
			var percent = string.match(/\d{2,3}/);
			if (!percent) return;

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
		}

		/**
		 * @this {Worker}
		 * @param {Object} param
		 * @param {import('./includes/worker.js').WorkerResponse} param.data
		 */
		function workerHandler({ data }) {
			var { action, message, verification } = data;

			if (action === 'captchaSuccess') {
				appendVerification(form, verification);
				enableButton(button, finished);
				removeWorker(whcWorkers, this);
				return;
			}
			if (action === 'message') {
				updatePercent(form, button, message);
				return;
			}
		}

		w.addEventListener('load', verify, {
			once: true,
			capture: true,
		});
	};

	forms.forEach((form, i) => new Constructor(form, i));
})(window);
