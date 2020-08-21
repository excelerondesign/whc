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
 */
import emitter from './includes/emit';
import worker from './includes/worker';

(function (w) {
	var merge = (o, o2) => Object.assign(o, o2),
		/**
		 * @type {whcOptions}
		 */
		config = merge(
			{
				button: '[type="submit"]',
				form: '.whc-form',
				difficulty: 3,
				finished: 'Submit',
				events: true,
			},
			w.whcConfig || {}
		),
		/** @type {NodeListOf<HTMLFormElement>} */
		forms = document.querySelectorAll(config.form),
		getSetting = (el, str) => {
			// console.log(whcConfig[str]);
			var d = 'dataset';
			if (str in el[d] === false) return config[str];
			var v = el[d][str];
			var n = +v; // coerces value into a number

			return isNaN(n) || +v !== n ? v : n;
		},
		h = 'whcW',
		a = 'setAttribute';
	/**
	 * A weird bug in firefox leads to web workers with no "Active reference" to be garbage collected
	 * So we create a global array to push workers into so that they don't get collected
	 * once the workers complete their job, they are splice from the array
	 * and terminated
	 */

	w[h] = [];

	config.events &&
		emitter.on('*', (t, detail) =>
			detail.form.dispatchEvent(
				new CustomEvent(t, { capture: true, detail })
			)
		);

	/**
	 * @param {HTMLFormElement} form
	 * @param {number} i
	 */
	var Constructor = function (form, i) {
		/** @type {HTMLButtonElement} */
		var button = form.querySelector(config.button),
			/** @type {number} */
			difficulty = getSetting(button, 'difficulty'),
			defaults = {
				event: 'whc:#',
				form,
				button,
				difficulty,
				verification: [],
				msg: '',
				percent: 0,
				done: false,
			};

		/** @param {Function} fn */
		function createWorker(fn) {
			try {
				return new Worker(
					URL.createObjectURL(
						new Blob(['(' + fn.toString() + ')()'], {
							type: 'application/javascript',
						})
					)
				);
			} catch (e) {
				throw Error(e);
			}
		}

		/** @this {Window} */
		function init() {
			this[h][i] = createWorker(worker);

			this[h][i].addEventListener('message', handler);
			this[h][i].postMessage({
				difficulty,
				time: Date.now(),
			});
			emitter.run(
				'whc:Start#' + i,
				merge(defaults, {
					event: 'whc:Start#' + i,
				})
			);
		}

		/**
		 * @param {Object} param
		 * @param {HTMLFormElement} param.form
		 * @param {import('./includes/worker.js').Verification} param.verification
		 */
		function appendVerification({ form, button, verification }) {
			var l = document.createElement`input`;
			l[a]('type', 'hidden');
			l[a]('name', 'captcha_verification');
			l[a]('value', JSON.stringify(verification));
			form.appendChild(l);
			button.classList.add('done');
			button.removeAttribute`disabled`;
			button[a]('value', getSetting(button, 'finished'));
			w[h][i].terminate();
		}

		/**
		 * @param {Object} param
		 * @param {HTMLButtonElement} param.button
		 * @param {string} param.message
		 */
		function updatePercent({ button, msg }) {
			var percent = msg.match(/\d{2,3}/);
			if (!percent) return;
			button[a]('data-pecent', percent + '%');

			emitter.run(
				'whc:Progress#' + i,
				merge(defaults, {
					event: 'whc:Progress#' + i,
					percent: +percent,
					done: +percent == 100,
				})
			);
		}

		emitter.on('whc:Update#' + i, updatePercent);
		emitter.on('whc:Complete#' + i, appendVerification);

		/**
		 * @this {Worker}
		 * @param {Object} param
		 * @param {import('./includes/worker.js').WorkerResponse} param.data
		 */
		function handler({ data }) {
			var { action, message, verification } = data,
				e = ['whc:Complete#' + i, 'whc:Update#' + i];
			if (action === 'captchaSuccess') {
				return emitter.run(
					e[0],
					merge(defaults, {
						event: e[0],
						verification,
						done: true,
						pecent: 100,
					})
				);
			}
			if (action === 'message') {
				return emitter.run(
					e[1],
					merge(defaults, {
						event: e[1],
						msg: message,
						percent: 0,
					})
				);
			}
		}

		w.addEventListener('load', init, {
			once: true,
			capture: true,
		});
	};

	var l = forms.length;
	for (; l--; ) {
		new Constructor(forms[l], l);
	}
})(window);
