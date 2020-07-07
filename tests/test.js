window.whcConfig = window.whcConfig || {};
window.whcConfig.events = true;
window.whcConfig.performance = true;
document.addEventListener('whc:Start', ({ detail }) => console.log(detail));

document.addEventListener('whc:Update', ({ detail }) => console.log(detail));

document.addEventListener('whc:Complete', ({ detail }) => {
	detail.form.classList.add('complete');
	console.log(detail);
});
