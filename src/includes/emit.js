import p from './performance';

/**
 * @typedef {Object} WHCEventDetail
 * @prop {HTMLFormElement} form
 * @prop {number} time
 * @prop {boolean} complete
 * @prop {number} [progress]
 * @prop {string} [error]
 * @prop {import('./worker.js').Verification[]} [verification]
 * @prop {string} emoji
 */

/**
 * @param {HTMLFormElement} form
 * @param {string} eventType
 * @param {WHCEventDetail} detail
 * @param {import('./performance.js').Perf[]} objects
 */
export default function (form, eventType, detail, perf, ...objects) {
	var defaultDetail = {
		form,
		time: Date.now(),
		done: false,
		verification: [],
		progress: 0,
	};

	var event = new CustomEvent(eventType, {
		bubbles: true,
		detail: Object.assign(defaultDetail, detail || {}),
	});

	form.dispatchEvent(event);

	if (perf && objects !== null) {
		objects.forEach(p); // if performance objects are passed, run the perf function
	}
}
