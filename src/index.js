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
	 * @param {DomStringMap} data
	 * @retuns {boolean}
	 */
	var isDebugging = form => {
		const { debug } = form.dataset;
		if (debug && debug === 'true') {
			return true;
		}
		return whcConfig.debug;
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

		/**
		 * @type {string}
		 */
		Private.eventName = 'WHC|' + Private.ID;

		Private.debug = isDebugging(form);

		if (Private.debug) {
			window.whcDetails = window.whcDetails || [];
			window.whcDetails.push({
				form: Private.form,
				button: Private.button,
				difficulty: Private.difficulty,
			});
			window.addEventListener(
				Private.eventName,
				({ detail }) =>
					console.log(Private.eventName + '::Message -> ' + detail),
				false
			);
		}

		/**
		 * @param {string} detail
		 */
		var emit = function (detail) {
			if (!Private.debug) return;
			window.dispatchEvent(
				new CustomEvent(Private.eventName, { detail })
			);
		};

		emit('Constructing');

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
			emit('createWorker(): Creating');
			try {
				// generates a worker by converting  into a string and then running that function as a worker
				var blob = new Blob(['(' + worker.toString() + ')();'], {
					type: 'application/javascript',
				});
				var blobUrl = URL.createObjectURL(blob);
				var laborer = new Worker(blobUrl);
				emit('createWorker(): Created');

				return laborer;
			} catch (e1) {
				emit('createWorker(): Error');
				//if it still fails, there is nothing much we can do
				throw new Error('Uknown Error: ' + e1);
			}
		};

		Private.worker = createWorker();

		var beginVerification = function () {
			var { difficulty, time, worker } = Private;

			emit('Difficulty Level: ' + difficulty);

			worker.postMessage({
				difficulty,
				time,
			});

			emit('Verification: Message Sent');
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
		};

		/**
		 * @param {HTMLButtonElement} button
		 * @param {string} string
		 */
		var updatePercent = function (button, string) {
			var percent = string.match(/\d*%/);
			if (percent === null) return;

			button.setAttribute('data-progress', percent);
			emit('Verification Progress: ' + percent);
		};

		/**
		 * @param {Object} param
		 * @param {WorkerResponse} param.data
		 */
		var workerMessageHandler = function ({ data }) {
			if (data.action === 'captchaSuccess') {
				addVerification(Private.form, data.verification);
				enableButton(Private.button);
				emit('Verification Progress: Complete');

				return;
			} else if (data.action === 'message') {
				updatePercent(Private.button, data.message);
				return;
			}
			emit('Message Handler: ERROR - UNKNOWN');
		};

		window.addEventListener('load', beginVerification, {
			once: true,
			capture: true,
		});

		Private.worker.addEventListener('message', workerMessageHandler, false);

		emit('Constructed');
	};

	forms.forEach((form, i) => new Constructor(form, i));
})();
