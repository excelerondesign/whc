/**
 * @typedef {Object} Perf
 * @prop {string} name
 * @prop {string} method
 * @prop {string} [start]
 */
/** @param {Perf} param0 */
export default function p({ name, method, start }) {
	performance[method](name, start);
}

function pComplete(index = 0) {
	return performance
		.getEntries()
		.filter(
			entry => entry.name.includes('whc:') && entry.name.includes(index)
		);
}
export { pComplete };
