export default function (element, eventType, detail = {}) {
	var event = new CustomEvent(eventType, {
		bubbles: true,
		detail,
	});

	element.dispatchEvent(event);
}
