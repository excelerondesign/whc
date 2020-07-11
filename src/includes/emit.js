// @ts-check
export default function () {
	const all = new Map();
	return {
		/**
		 * @param {string} e - event type
		 * @param {Function} fn function to run when the event is called, should accept an object
		 */
		on(e, fn) {
			const handlers = all.get(e);
			const added = handlers && handlers.push(fn);
			if (!added) {
				all.set(e, [fn]);
			}
		},
		// https://github.com/developit/mitt/blob/master/src/index.ts#L56
		/**
		 * @param {string} e event type
		 * @param {Function} fn function to run when the event is called, should accept an object
		 */
		off(e, fn) {
			const handlers = all.get(e);
			if (handlers) {
				handlers.splice(handlers.indexOf(fn) >>> 0, 1);
			}
		},
		/**
		 *
		 * @param {string} e - event type
		 * @param {import('../types').eventInterface} obj Arguments used for event handlers
		 */
		run(e, obj) {
			(all.get(e) || []).forEach(fn => fn(obj));
			(all.get('*') || []).forEach(fn => fn(e, obj));
		},
	};
}
