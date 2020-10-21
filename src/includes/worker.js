// @ts-check
export default function () {
	/** @type { (percentFor: number, percentOf: number) => number } */
	var getWholePercent = (percentFor, percentOf) => {
		return Math.floor((percentFor / percentOf) * 100);
	};

	/** @param {number} value */
	var isPrime = value => {
		for (var i = 2; i < value; i++) {
			if (value % i === 0) {
				return false;
			}
		}
		return value > 1;
	};

	/**
	 * @param {object} object
	 * @param {string} object.question
	 * @param {number} object.time
	 * @param {number} nonce
	 */
	function solveCaptcha({ question, time }, nonce = 1) {
		nonce++;

		var verifyArray = {
			question: question,
			time: time,
			nonce: nonce,
		};

		// @ts-ignore
		var currentHash = sha.hash(JSON.stringify(verifyArray));

		while (currentHash.substr(0, 4) !== '0000' || !isPrime(nonce)) {
			nonce++;
			var verifyArray = {
				question: question,
				time: time,
				nonce: nonce,
			};
			// @ts-ignore
			var currentHash = sha.hash(JSON.stringify(verifyArray));
		}

		return {
			verify_array: verifyArray,
			nonce: nonce,
			hash: currentHash,
		};
	}

	async function sendRequest() {
		var formData = new FormData();

		formData.append('endpoint', 'question');

		var response = await fetch('https://wehatecaptchas.com/api.php', {
			method: 'POST',
			body: formData,
		});

		var data = await response.json();

		return data.data.question;
	}

	self.addEventListener(
		'message',
		/**
		 * @param {object} param
		 * @param {import('../types').WorkerResponse} param.data
		 */
		function ({ data }) {
			// @ts-ignore
			var { difficulty, time } = data;
			// @ts-ignore
			self.postMessage({
				action: 'message',
				message:
					"Checking if you're a bot before enabling submit button...",
			});

			sendRequest().then(
				/** @param {string} question */
				function (question) {
					var verification = [];
					var nonce = nonce ?? 1;

					for (var i = 0; i < difficulty; i++) {
						var response = solveCaptcha({ question, time }, nonce);
						var nonce = response.nonce;
						verification.push(response.verify_array);
						var percentDone = getWholePercent(i + 1, difficulty);
						// @ts-ignore
						self.postMessage({
							action: 'message',
							message:
								'Still checking... ' + percentDone + '% done',
						});
					}

					// @ts-ignore
					self.postMessage({
						action: 'captchaSuccess',
						verification: verification,
					});

					verification = [];
					nonce = 1;
				}
			);
		},
		false
	);
}
