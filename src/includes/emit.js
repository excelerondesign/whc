export default new (function () {
	const all = new Map();
	return {
		/**
		 * @param {string} e - event type
		 * @param {Function} fn function to run when the event is called, should accept an object
		 */
		on(e, fn) {
			return (h = all.get(e)), !(h && h.push(fn)) && all.set(e, [fn]);
		},
		/**
		 *
		 * @param {string} e - event type
		 * @param {EventObject} obj Arguments used for event handlers
		 */
		run(e, obj) {
			(all.get(e) || []).forEach(fn => fn(obj));
			(all.get('*') || []).forEach(fn => fn(e, obj));
		},
	};
})();
