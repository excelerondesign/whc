export default function (element, eventType, details = {}) {
	var event = new CustomEvent('WHC::' + eventType, {
		bubbles: true,
		details,
	});

	element.dispatchEvent(event);
}
