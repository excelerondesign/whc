/*!
 * WeHateCaptchas Self-Instantiating-Plugin
 * (c) 2020 Exceleron Designs, MIT License, https://excelerondesigns.com
 */

/**
 * @typedef {Object} whcOptions
 * @prop {string} button - Valid querySelector string
 * @prop {string} form - Valid className string
 //// @prop {boolean} debug - Boolean to control debug messaging
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

(function () {
	window.whcWorkers = [];
	/**
	 * @type {whcOptions} whcDefaults
	 */
	var whcDefaults = {
		button: '[type="submit"]',
		form: '.whc-form',
		//// debug: false,
		difficulty: 3,
		finished: 'Submit',
		events: true,
	};

	/**
	 * @type {whcOptions}
	 */
	var windowWhcConfig = window.whcConfig || {};
	/**
	 * @type {whcOptions}
	 */
	var whcConfig = Object.assign(whcDefaults, windowWhcConfig);
	console.log(whcConfig);
	/**
	 * @type {NodeListOf<HTMLFormElement>} forms
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
	 * @param {HTMLFormElement} data
	 * @retuns {boolean}
	 */
	var isDebugging = form => {
		if (!'debug' in form.dataset) return whcConfig.debug;
		var { debug } = form.dataset;
		if (debug !== 'true') return false;
		return true;
	};

	/**
	 * @class
	 * @param {HTMLFormElement} form
	 * @param {number} index
	 */
	var Constructor = function (form, index) {
		var Private = {};

		/**
		 * @type {number} Now converted to seconds
		 */
		Private.time = Math.floor(Date.now() / 1000);

		/**
		 * @type {HTMLFormElement}
		 */
		Private.form = form;

		/**
		 * @type {string}
		 */
		Private.ID = form.getAttribute('id') || 'Form ' + index;

		/**
		 * @type {HTMLButtonElement}
		 */
		Private.button = form.querySelector(whcConfig.button);

		/**
		 * @type {number}
		 */
		Private.difficulty =
			parse(Private.button.getAttribute('data-difficulty')) ||
			whcConfig.difficulty;

		Private.events = isDebugging(form) || whcConfig.events;

		/**
		 * @param {HTMLButtonElement} button
		 */
		var enableButton = function (button) {
			var { finished } = button.dataset;
			button.classList.add('done');
			button.removeAttribute('disabled');
			button.setAttribute('value', finished);
		};

		var createWorker = function () {
			try {
				// generates a worker by converting  into a string and then running that function as a worker
				var blob = new Blob(['(' + worker.toString() + ')();'], {
					type: 'application/javascript',
				});
				var blobUrl = URL.createObjectURL(blob);
				var laborer = new Worker(blobUrl);
				window.whcWorkers.push(laborer);
				return laborer;
			} catch (e1) {
				throw new Error('Uknown Error: ' + e1);
			}
		};

		Private.worker = createWorker();

		var beginVerification = function () {
			var { difficulty, time, worker } = Private;
			worker.postMessage({
				difficulty,
				time,
			});
		};

		/**
		 * @param {HTMLFormElement} form
		 * @param {Verification} verification
		 */
		var addVerification = function (form, verification) {
			var input = document.createElement('input');
			input.setAttribute('type', 'hidden');
			input.setAttribute('name', 'captcha_verification');
			input.setAttribute('value', JSON.stringify(verification));
			form.appendChild(input);
			if (Private.events) {
				emit(Private.form, 'WHC::Verification', {
					form: Private.form,
					verification: verification,
				});
			}
		};

		/**
		 * @param {HTMLButtonElement} button
		 * @param {string} string
		 */
		var updatePercent = function (button, string) {
			var percent = string.match(/\d{2,3}/);
			if (percent === null) return;

			button.setAttribute('data-progress', percent + '%');
			if (Private.events)
				emit(Private.form, 'WHC::Progress', {
					progress: percent + '%',
					complete: percent[0] === '100',
				});
		};

		/**
		 * @param {Object} param
		 * @param {WorkerResponse} param.data
		 */
		var workerMessageHandler = function ({ data }) {
			if (data.action === 'captchaSuccess') {
				addVerification(Private.form, data.verification);
				enableButton(Private.button);
				return;
			}
			if (data.action === 'message') {
				updatePercent(Private.button, data.message);
				return;
			}
		};

		window.addEventListener('load', beginVerification, {
			once: true,
			capture: true,
		});

		Private.worker.addEventListener('message', workerMessageHandler, false);

		if (Private.events)
			emit(Private.form, 'WHC::Initialize', {
				form: Private.form,
				ID: Private.ID,
				button: Private.button,
				difficulty: Private.difficulty,
			});
	};

	forms.forEach((form, i) => new Constructor(form, i));
})();
