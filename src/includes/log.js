// @ts-check
const history = new WeakMap();
/**
 * @param {HTMLFormElement} form
 */
let Log = form => {
	const id = '#' + form.getAttribute('id'),
		eventName = 'whc' + id;

	return new Proxy(
		{
			set history(value) {
				history.has(form)
					? history.set(form, [...history.get(form), value])
					: history.set(form, [value]);
			},
			get history() {
				return history.get(form);
			},
			/**
			 * @param {object} detail
			 */
			set event(detail) {
				document.dispatchEvent(new CustomEvent(eventName, { detail }));
			},
		},
		{
			/**
			 *
			 * @param {object} target
			 * @param {string} key
			 * @param {object} value
			 */
			set(target, key, value) {
				if (key === 'history') return target.history;
				const entry = Object.assign(
					{
						form: id,
						type: key,
						timestamp: performance.now(),
					},
					value
				);
				target.history = entry;
				target.event = entry;
				return true;
			},
		}
	);
};

export default Log;
