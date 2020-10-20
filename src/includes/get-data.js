export default function getData(form) {
	if (!form.hasAttribute('id')) throw Error('Form is missing ID attribute');

	const data = {
		button: form.querySelector('[type="submit"]'),
		difficulty: parseInt(form.dataset.difficulty) || 5,
		debug: 'debug' in form.dataset,
		eventName: 'WHC|' + form.getAttribute('id'),
		finished: 'finished' in form.dataset ? form.dataset.finished : 'Submit',
	};

	if ('button' in form.dataset) {
		// prettier-ignore
		data.button = document.querySelector('[form="' + form.getAttribute('id') + '"][type="submit"]');
	}

	return data;
}
