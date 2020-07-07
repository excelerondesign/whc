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

// import emit from './includes/emit';
import emitter from './includes/emit';
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
	const whcConfig = Object.assign(
		{
			button: '[type="submit"]',
			form: '.whc-form',
			difficulty: 3,
			finished: 'Submit',
			events: true,
			perf: false,
		},
		w.whcConfig || {}
	);
	console.log(emitter);
	/** @type {NodeListOf<HTMLFormElement>} */
	const forms = document.querySelectorAll(whcConfig.form);

	whcConfig.events &&
		emitter.on('*', obj =>
			window.dispatchEvent(
				new CustomEvent(obj.eventName, { detail: obj })
			)
		);
	emitter.on('*', console.log);
	const getDataset = (target, str) => {
		if (!str in target.dataset) return false;
		var value = target.dataset[str];
		var num = +value; // coerces value into a number

		if (isNaN(num) || num !== num) return value;
		return num;
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
		const difficulty =
			getDataset(button, 'difficulty') || whcConfig.difficulty;

		const finished = getDataset(button, 'finished') || whcConfig.finished;

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
				const blob = new Blob(['(' + fn.toString() + ')();'], {
					type: 'application/javascript',
				});
				const blobUrl = URL.createObjectURL(blob);
				return new Worker(blobUrl);
			} catch (e) {
				throw new Error('Unknown Error: ' + e);
			}
		}

		/**
		 * @param {Worker[]} workerArr
		 * @param {Worker} w
		 */
		function removeWorker(workerArr, w) {
			w.terminate();
			workerArr.splice(workerArr.indexOf(w), 1);
		}

		function verify() {
			const { events, perf } = whcConfig;
			const time = Date.now();
			whcWorkers.push(createWorker(worker));

			whcWorkers[i].addEventListener('message', workerHandler);
			whcWorkers[i].postMessage({
				difficulty,
				time,
			});
			emitter.run('whc:Start#' + i, {
				...eventDefault,
				...{
					eventName: 'whc:Start#' + i,
					time: +new Date(),
					emoji: '🚗💨',
				},
			});
			/*
			if (events)
				emit(
					{ form, index },
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
			*/
		}

		/**
		 * @param {HTMLFormElement} form
		 * @param {import('./includes/worker.js').Verification} verification
		 */
		function appendVerification(form, verification) {
			const { events, perf } = whcConfig;
			const input = document.createElement('input');
			input.setAttribute('type', 'hidden');
			input.setAttribute('name', 'captcha_verification');
			input.setAttribute('value', JSON.stringify(verification));
			form.appendChild(input);
			emitter.run('whc:Complete#' + i, {
				...eventDefault,
				...{
					eventName: 'whc:Complete#' + i,
					verification,
					done: true,
					emoji: '✅',
					progress: '100%',
				},
			});
			/*
			if (events)
				emit(
					{ form, index },
					'whc:Complete',
					{
						verification,
						done: true,
						emoji: '✅',
						progress: '100%',
					},
					perf,
					{ name: whcComplete, method: 'measure', start: whcStart }
				);
			*/
		}

		/**
		 * @param {HTMLFormElement} form
		 * @param {HTMLButtonElement} button
		 * @param {string} string
		 */
		function updatePercent(button, string) {
			const { events, perf } = whcConfig;
			const percent = string.match(/\d{2,3}/);
			if (!percent) return;

			button.setAttribute('data-progress', percent + '%');
			emitter.run('whc:Update#' + i, {
				...eventDefault,
				...{
					time: +new Date(),
					progress: percent + '%',
					done: +percent[0] === 100,
					emoji: '🔔',
				},
			});
			/*
			if (events)
				emit(
					{ form, index },
					'whc:Update',
					{
						progress: percent + '%',
						done: +percent[0] === 100,
						emoji: '🔔',
					},
					perf,
					{ name: whcUpdate, method: 'mark' }
				);
			*/
		}

		/**
		 * @this {Worker}
		 * @param {Object} param
		 * @param {import('./includes/worker.js').WorkerResponse} param.data
		 */
		function workerHandler({ data }) {
			const { action, message, verification } = data;

			if (action === 'captchaSuccess') {
				appendVerification(form, verification);
				enableButton(button, finished);
				removeWorker(whcWorkers, this);
				return;
			}
			if (action === 'message') {
				updatePercent(button, message);
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
