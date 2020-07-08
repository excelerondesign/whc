/*!
 * WeHateCaptchas Self-Instantiating-Plugin
 * (c) 2020 Exceleron Designs, MIT License, https://excelerondesigns.com
 */

/**
 * @typedef whcOptions
 * @type {Object}
 * @prop {string} button - Valid querySelector string
 * @prop {string} form - Valid className string
 * @prop {number} difficulty - Number of "questions" to answer
 * @prop {string} finished - Final value after all questions are solved
 * @prop {boolean} events - Should emit custom events?
 * @prop {boolean} perf - Should track performance?
 */
import emitter from './includes/emit';
import worker from './includes/worker';

(function (w) {
	/**
	 * @type {whcOptions}
	 */
	const whcConfig = {
		...{
			button: '[type="submit"]',
			form: '.whc-form',
			difficulty: 3,
			finished: 'Submit',
			events: true,
			perf: false,
		},
		...(w.whcConfig || {}),
	};

	/** @type {NodeListOf<HTMLFormElement>} */
	const forms = document.querySelectorAll(whcConfig.form);

	/**
	 * A weird bug in firefox leads to web workers with no "Active reference" to be garbage collected
	 * So we create a global array to push workers into so that they don't get collected
	 * once the workers complete their job, they are splice from the array
	 * and terminated
	 */
	w.whcWorkers = new Array();
	w.whcWorkers.length = forms.length;

	whcConfig.events &&
		emitter.on('*', (type, detail) =>
			detail.form.dispatchEvent(
				new CustomEvent(type, { capture: true, detail })
			)
		);
	// emitter.on('*', console.log);
	const getSetting = (target, str) => {
		// console.log(whcConfig[str]);
		if (str in target.dataset === false) return whcConfig[str];
		var value = target.dataset[str];
		var num = +value; // coerces value into a number

		return isNaN(num) || num !== num ? value : num;
	};

	const merge = (obj1, obj2) => {
		return {
			...obj1,
			...obj2,
		};
	};

	/**
	 * @param {HTMLFormElement} form
	 * @param {number} i
	 */
	var Constructor = function (form, i) {
		/**
		 * @type {HTMLButtonElement}
		 */
		const button = form.querySelector(whcConfig.button);

		/**
		 * @type {number}
		 */
		const difficulty = getSetting(button, 'difficulty');

		const finished = getSetting(button, 'finished');

		const eventDefault = {
			eventName: 'whc:Update#' + i,
			form,
			time: +new Date(),
			difficulty,
			verification: [],
			perf: [],
			progress: '0%',
			done: false,
		};

		/** @param {HTMLButtonElement} button */
		function enableButton() {
			button.classList.add('done');
			button.removeAttribute('disabled');
			button.setAttribute('value', finished);
		}

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

		/** @param {Worker} laborer */
		function removeWorker(laborer) {
			laborer.terminate();
			whcWorkers[i] = null;
		}

		function verify() {
			const time = +new Date();
			this.whcWorkers[i] = createWorker(worker);

			this.whcWorkers[i].addEventListener('message', workerHandler);
			this.whcWorkers[i].postMessage({
				difficulty,
				time,
			});
			emitter.run(
				'whc:Start#' + i,
				merge(eventDefault, {
					eventName: 'whc:Start#' + i,
					time,
					emoji: '🚗💨',
				})
			);
		}

		/**
		 * @param {Object} param
		 * @param {HTMLFormElement} param.form
		 * @param {import('./includes/worker.js').Verification} param.verification
		 */
		function appendVerification({ form, verification }) {
			const input = document.createElement('input');
			input.setAttribute('type', 'hidden');
			input.setAttribute('name', 'captcha_verification');
			input.setAttribute('value', JSON.stringify(verification));
			form.appendChild(input);
		}

		/**
		 * @param {Object} param
		 * @param {HTMLButtonElement} param.button
		 * @param {string} param.message
		 */
		function updatePercent({ button, message }) {
			const percent = message.match(/\d{2,3}/);
			if (!percent) return;

			button.setAttribute('data-progress', percent + '%');
			emitter.run(
				'whc:Progress#' + i,
				merge(eventDefault, {
					eventName: 'whc:Progress#' + i,
					time: +new Date(),
					progress: percent[0] + '%',
					done: +percent[0] === 100,
					emoji: '🔔',
				})
			);
		}

		emitter.on('whc:Update#' + i, updatePercent);
		emitter.on('whc:Complete#' + i, appendVerification);
		emitter.on('whc:Complete#' + i, enableButton);
		emitter.on('whc:Complete#' + i, () => removeWorker(whcWorkers[i]));

		/**
		 * @this {Worker}
		 * @param {Object} param
		 * @param {import('./includes/worker.js').WorkerResponse} param.data
		 */
		function workerHandler({ data }) {
			const { action, message, verification } = data;

			if (action === 'captchaSuccess') {
				return emitter.run(
					'whc:Complete#' + i,
					merge(eventDefault, {
						eventName: 'whc:Complete#' + i,
						verification,
						done: true,
						emoji: '✅',
						progress: '100%',
					})
				);
			}
			if (action === 'message') {
				return emitter.run(
					'whc:Update#' + i,
					merge(eventDefault, {
						eventName: 'whc:Completed#' + i,
						time: +new Date(),
						message,
						button,
						progress: 'Updating',
						emoji: '🔔',
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
