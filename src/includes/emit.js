/**
 * @param {HTMLElement} element
 * @param {string} eventType
 * @param {WHCEventDetail} detail
 */
export default function (element, eventType, detail) {
	var event = new CustomEvent(eventType, {
		bubbles: true,
		detail: detail || {},
	});

	element.dispatchEvent(event);
}
