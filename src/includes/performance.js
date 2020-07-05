/**
 *
 * @param {string} name - Performance mark/measure name
 * @param {string} method - 'mark'/'measure'
 * @param {string} start - Name of the performance mark to measure based on
 */
export default function p(name, method, start) {
	performance[method](name, start);
}

function pComplete() {
	return performance
		.getEntries()
		.filter(entry => entry.name.includes('whc:'));
}
export { pComplete };
