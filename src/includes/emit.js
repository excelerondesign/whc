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
 * @param {HTMLFormElement} form
 * @param {string} eventType
 * @param {WHCEventDetail} detail
 */
export default function (form, eventType, detail) {
	var defaultDetail = {
		form,
		time: Date.now(),
	};
	var event = new CustomEvent(eventType, {
		bubbles: true,
		detail: Object.assign(defaultDetail, detail || {}),
	});

	form.dispatchEvent(event);
}
