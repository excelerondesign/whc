window.whcConfig = window.whcConfig || {};
window.whcConfig.events = true;
window.whcConfig.perf = true;
window.addEventListener('whc:Start#2', event =>
	console.log(event.type, event.detail)
);

/*
document.addEventListener('whc:Update', ({ detail }) => console.log(detail));

document.addEventListener('whc:Complete', ({ detail }) => {
	detail.form.classList.add('complete');
	console.log(detail);
});
*/

document
	.querySelectorAll('form')[0]
	.addEventListener('whc:Progress#0', console.log);
