const parseDifficulty = val => {
	let n = parseInt(val);
	return n === n && !Number.isNaN(parseInt(val)) && n;
};

const getButton = form => {
	if ('button' in form.dataset) {
		return document.querySelector(
			'[form="' + form.getAttribute('id') + '"][type="submit"]'
		);
	}
	return form.querySelector('[type="submit"]');
};

export default function getSettings(form) {
	if (!form.hasAttribute('id')) throw Error('Form is missing ID attribute');

	const settings = {
		button: getButton(form),
		difficulty: parseDifficulty(form.dataset.difficulty) || 5,
		debug: 'debug' in form.dataset,
		eventName: 'whc:' + form.getAttribute('id'),
		finished: 'finished' in form.dataset ? form.dataset.finished : 'Submit',
	};

	return settings;
}
