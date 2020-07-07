import p, { pComplete } from './performance';

/**
 * @typedef {Object} WHCEventDetail
 * @prop {Object} param0
 * @prop {HTMLFormElement} param0.form
 * @prop {number} param0.index
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

/*
 export default function ({ form, index }, eventType, detail, perf, ...objects) {
	if (perf && objects !== null) {
		objects.forEach(p); // if performance objects are passed, run the perf function
	}

	var event = new CustomEvent(eventType, {
		bubbles: true,
		detail: Object.assign(
			{
				form,
				time: +new Date(), // coerces date into a number
				done: false,
				verification: [],
				progress: 0,
				perf: eventType === 'whc:Complete' ? pComplete(index) : [],
			},
			detail || {}
		),
	});

	form.dispatchEvent(event);
}
*/

export default new (function () {
	const all = new Map();
	return {
		on(e, fn) {
			const handlers = all.get(e);
			const added = handlers && handlers.push(fn);
			if (!added) {
				all.set(e, [fn]);
			}
		},
		// https://github.com/developit/mitt/blob/master/src/index.ts#L56
		off(e, fn) {
			const handlers = all.get(e);
			if (handlers) {
				handlers.splice(handlers.indexOf(fn) >>> 0, 1);
			}
		},
		run(e, obj) {
			(all.get(e) || []).forEach(fn => fn(obj));
			(all.get('*') || []).forEach(fn => fn(obj));
		},
	};
})();
