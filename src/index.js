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
 */

/**
 * @typedef {Object} Verification
 * @prop {number} nonce
 * @prop {number} time
 * @prop {string} question
 */

/**
 * @typedef {Object} WorkerResponse
 * @prop {string} action
 * @prop {string} message
 * @prop {number} difficulty
 * @prop {number} time
 * @prop {Verification[]} verification
 */

import emit from './includes/emit';
import worker from './includes/worker';

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
	var whcDefaults = {
		button: '[type="submit"]',
		form: '.whc-form',
		difficulty: 3,
		finished: 'Submit',
		events: true,
	};

	/**
	 * @type {whcOptions}
	 */
	var windowWhcConfig = w.whcConfig || {};

	/**
	 * @type {whcOptions}
	 */
	var whcConfig = Object.assign(whcDefaults, windowWhcConfig);

	/**
	 * @type {NodeListOf<HTMLFormElement>}
	 */
	var forms = document.querySelectorAll(whcConfig.form);

	/**
	 * @param {string} str
	 */
	var parse = function (str) {
		var num = parseInt(str);

		if (isNaN(num)) return false;
		if (num !== num) return false;

		return num;
	};

	/**
	 * @class
	 * @param {HTMLFormElement} form
	 * @param {number} index
	 */
	var Constructor = function (form, index) {
		/**
		 * @type {number} Now converted to seconds
		 */
		const time = Math.floor(Date.now() / 1000);

		/**
		 * @type {HTMLFormElement}
		 */
		const form = form;

		/**
		 * @type {HTMLButtonElement}
		 */
		const button = form.querySelector(whcConfig.button);

		/**
		 * @type {number}
		 */
		const difficulty =
			parse(button.getAttribute('data-difficulty')) ||
			whcConfig.difficulty;

		/**
		 * @param {HTMLButtonElement} button
		 */
		function enableButton(button) {
			var { finished } = button.dataset;
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
				throw new Error('Uknown Error: ' + e1);
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
			var laborer = createWorker(worker);
			w.whcWorkers.push(laborer);

			laborer.addEventListener('message', workerHandler);
			laborer.postMessage({
				difficulty,
				time,
			});

			if (whcConfig.events)
				emit(form, 'WHC:Start', {
					form,
					time,
					difficulty,
					complete: false,
					emoji: '🚗💨',
				});
		}

		/**
		 * @param {HTMLFormElement} form
		 * @param {Verification} verification
		 */
		function appendVerification(form, verification) {
			var input = document.createElement('input');
			input.setAttribute('type', 'hidden');
			input.setAttribute('name', 'captcha_verification');
			input.setAttribute('value', JSON.stringify(verification));
			form.appendChild(input);
			if (whcConfig.events)
				emit(form, 'WHC:Complete', {
					form,
					time: Date.now(),
					verification: verification,
					complete: true,
					emoji: '✅',
				});
		}

		/**
		 * @param {HTMLButtonElement} button
		 * @param {string} string
		 */
		function updatePercent(form, button, string) {
			var percent = string.match(/\d{2,3}/);
			if (!percent) return;

			button.setAttribute('data-progress', percent + '%');
			if (whcConfig.events)
				emit(form, 'WHC:Update', {
					form,
					time: Date.now(),
					progress: percent + '%',
					complete: percent[0] === '100',
					emoji: '🔔',
				});
		}

		/**
		 * @this {Worker}
		 * @param {Object} param
		 * @param {WorkerResponse} param.data
		 */
		function workerHandler({ data }) {
			var { action, message, verification } = data;

			if (action === 'captchaSuccess') {
				appendVerification(form, verification);
				enableButton(button);
				removeWorker(workerArr, this);

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
