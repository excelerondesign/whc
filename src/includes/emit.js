/**
 * @typedef {Object} Verification
 * @prop {number} nonce
 * @prop {number} time
 * @prop {string} question
 */

/**
 * @typedef {Object} WHCEventDetail
 * @prop {HTMLFormElement} form
 * @prop {number} time
 * @prop {boolean} complete
 * @prop {number} [progress]
 * @prop {string} [error]
 * @prop {Verification[]} [verification]
 * @prop {string} emoji
 */

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
