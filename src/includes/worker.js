/**
 * @typedef {Object} WorkerResponse
 * @prop {string} action
 * @prop {string} message
 * @prop {number} difficulty
 * @prop {number} time
 * @prop {Verification[]} verification
 */
/**
 * @typedef {Object} Verification
 * @prop {number} nonce
 * @prop {number} time
 * @prop {string} question
 */
/**
 * @typedef {Object} EncodedMessage
 * @prop {number[][]} M
 * @prop {number} N
 */
export default function () {
	/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
	/*  SHA-256 implementation in JavaScript | (c) Chris Veness 2002-2010 | www.movable-type.co.uk    */
	/*   - see http://csrc.nist.gov/groups/ST/toolkit/secure_sha256.html                             */
	/*         http://csrc.nist.gov/groups/ST/toolkit/examples.html                                   */
	/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

	// 0xffffffff is an unsigned int, a constant which is not present in javascrript

	function utilities() {}
	utilities.prototype = {
		// constants [§4.2.2]
		/** @const {number[]} K */
		K: [
			0x428a2f98,
			0x71374491,
			0xb5c0fbcf,
			0xe9b5dba5,
			0x3956c25b,
			0x59f111f1,
			0x923f82a4,
			0xab1c5ed5,
			0xd807aa98,
			0x12835b01,
			0x243185be,
			0x550c7dc3,
			0x72be5d74,
			0x80deb1fe,
			0x9bdc06a7,
			0xc19bf174,
			0xe49b69c1,
			0xefbe4786,
			0x0fc19dc6,
			0x240ca1cc,
			0x2de92c6f,
			0x4a7484aa,
			0x5cb0a9dc,
			0x76f988da,
			0x983e5152,
			0xa831c66d,
			0xb00327c8,
			0xbf597fc7,
			0xc6e00bf3,
			0xd5a79147,
			0x06ca6351,
			0x14292967,
			0x27b70a85,
			0x2e1b2138,
			0x4d2c6dfc,
			0x53380d13,
			0x650a7354,
			0x766a0abb,
			0x81c2c92e,
			0x92722c85,
			0xa2bfe8a1,
			0xa81a664b,
			0xc24b8b70,
			0xc76c51a3,
			0xd192e819,
			0xd6990624,
			0xf40e3585,
			0x106aa070,
			0x19a4c116,
			0x1e376c08,
			0x2748774c,
			0x34b0bcb5,
			0x391c0cb3,
			0x4ed8aa4a,
			0x5b9cca4f,
			0x682e6ff3,
			0x748f82ee,
			0x78a5636f,
			0x84c87814,
			0x8cc70208,
			0x90befffa,
			0xa4506ceb,
			0xbef9a3f7,
			0xc67178f2,
		],

		// initial hash value [§5.3.1]
		/** @const {number[]} H */
		H: [
			0x6a09e667,
			0xbb67ae85,
			0x3c6ef372,
			0xa54ff53a,
			0x510e527f,
			0x9b05688c,
			0x1f83d9ab,
			0x5be0cd19,
		],

		/**
		 * @param {number} n
		 */
		toHexString: function (n) {
			var s = '',
				v;
			for (var i = 7; i >= 0; i--) {
				v = (n >>> (i * 4)) & 0xf;
				s += v.toString(16);
			}
			return s;
		},
		/**
		 * @param {number} n
		 * @param {number} x
		 */
		ROTR: function (n, x) {
			return (x >>> n) | (x << (32 - n));
		},

		/**
		 * @param {number} x
		 */
		Sigma0: function (x) {
			return this.ROTR(2, x) ^ this.ROTR(13, x) ^ this.ROTR(22, x);
		},
		/**
		 * @param {number} x
		 */
		Sigma1: function (x) {
			return this.ROTR(6, x) ^ this.ROTR(11, x) ^ this.ROTR(25, x);
		},
		/**
		 * @param {number} x
		 * */
		sigma0: function (x) {
			return this.ROTR(7, x) ^ this.ROTR(18, x) ^ (x >>> 3);
		},
		/** @param {number} x */
		sigma1: function (x) {
			return this.ROTR(17, x) ^ this.ROTR(19, x) ^ (x >>> 10);
		},

		/**
		 * @param {number} x
		 * @param {number} y
		 * @param {number} z
		 */
		Ch: function (x, y, z) {
			return (x & y) ^ (~x & z);
		},

		/**
		 * @param {number} x
		 * @param {number} y
		 * @param {number} z
		 */
		Maj: function (x, y, z) {
			return (x & y) ^ (x & z) ^ (y & z);
		},
	};
	/**
	 * Contains all the hashing functions for sha256 algorithm
	 */
	function sha256() {
		/**
		 * @param {string} msg
		 * @returns {EncodedMessage}
		 */
		this.encodeMessage = function (msg) {
			msg += String.fromCharCode(0x80); // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

			// convert string msg into 512-bit/16-integer blocks arrays of ints [§5.2.1]
			var l = msg.length / 4 + 2; // length (in 32-bit integers) of msg + ‘1’ + appended length
			var N = Math.ceil(l / 16); // number of 16-integer-blocks required to hold 'l' ints
			/** @type {number[][]} M - An Array of number arrays */
			var M = new Array(N);

			for (var i = 0; i < N; i++) {
				M[i] = new Array(16);
				for (var j = 0; j < 16; j++) {
					// encode 4 chars per integer, big-endian encoding
					M[i][j] =
						(msg.charCodeAt(i * 64 + j * 4) << 24) |
						(msg.charCodeAt(i * 64 + j * 4 + 1) << 16) |
						(msg.charCodeAt(i * 64 + j * 4 + 2) << 8) |
						msg.charCodeAt(i * 64 + j * 4 + 3);
				} // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
			}
			// add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
			// note: most significant word would be (len-1)*8 >>> 32, but since JS converts
			// bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
			M[N - 1][14] = ((msg.length - 1) * 8) / Math.pow(2, 32);
			M[N - 1][14] = Math.floor(M[N - 1][14]);
			M[N - 1][15] = ((msg.length - 1) * 8) & 0xffffffff;

			return {
				M,
				N,
			};
		};
		/**
		 * @param {EncodedMessage} encodedMessage
		 * @param {number[]} H
		 * @param {number[]} K
		 */
		this.computeHash = function ({ M, N }, H, K) {
			var W = new Array(64);
			var a, b, c, d, e, f, g, h;
			for (var i = 0; i < N; i++) {
				// 1 - prepare message schedule 'W'
				for (var t = 0; t < 16; t++) W[t] = M[i][t];
				for (var t = 16; t < 64; t++)
					W[t] =
						(this.sigma1(W[t - 2]) +
							W[t - 7] +
							this.sigma0(W[t - 15]) +
							W[t - 16]) &
						0xffffffff;

				// 2 - initialise working variables a, b, c, d, e, f, g, h with previous hash value
				a = H[0];
				b = H[1];
				c = H[2];
				d = H[3];
				e = H[4];
				f = H[5];
				g = H[6];
				h = H[7];

				// 3 - main loop (note 'addition modulo 2^32')
				for (var t = 0; t < 64; t++) {
					var T1 =
						h + this.Sigma1(e) + this.Ch(e, f, g) + K[t] + W[t];
					var T2 = this.Sigma0(a) + this.Maj(a, b, c);
					h = g;
					g = f;
					f = e;
					e = (d + T1) & 0xffffffff;
					d = c;
					c = b;
					b = a;
					a = (T1 + T2) & 0xffffffff;
				}
				// 4 - compute the new intermediate hash value (note 'addition modulo 2^32')
				H[0] = (H[0] + a) & 0xffffffff;
				H[1] = (H[1] + b) & 0xffffffff;
				H[2] = (H[2] + c) & 0xffffffff;
				H[3] = (H[3] + d) & 0xffffffff;
				H[4] = (H[4] + e) & 0xffffffff;
				H[5] = (H[5] + f) & 0xffffffff;
				H[6] = (H[6] + g) & 0xffffffff;
				H[7] = (H[7] + h) & 0xffffffff;
			}
			const hashMap = H.map(hash => this.toHexString(hash));
			return hashMap;
		};
		/**
		 * @param {(string|number)} msg
		 * @returns {string}
		 */
		this.hash = function (msg) {
			const encodedMessage = this.encodeMessage(msg);
			const intermediateHash = this.computeHash(
				encodedMessage,
				this.H,
				this.K
			);
			const hashedString = intermediateHash.join('');
			return hashedString;
		};
		return this;
	}

	sha256.prototype = Object.assign({}, utilities.prototype);

	var sha = new sha256();

	/**
	 * @param {number} percentFor
	 * @param {number} percentOf
	 */
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
	 * @param {Object} object
	 * @param {string} object.question
	 * @param {number} object.time
	 * @param {number} nonce
	 */
	var solveCaptcha = ({ question, time }, nonce = 1) => {
		nonce++;
		var verifyArray = {
			question: question,
			time: time,
			nonce: nonce,
		};

		var currentHash = sha.hash(JSON.stringify(verifyArray));

		while (currentHash.substr(0, 4) !== '0000' || !isPrime(nonce)) {
			nonce++;
			var verifyArray = {
				question: question,
				time: time,
				nonce: nonce,
			};
			var currentHash = sha.hash(JSON.stringify(verifyArray));
		}

		return {
			verify_array: verifyArray,
			nonce: nonce,
			hash: currentHash,
		};
	};

	/**
	 * @param {string} url
	 * @returns {string}
	 */
	var sendRequest = async function (url) {
		var formData = new FormData();

		formData.append('endpoint', 'question');

		var response = await fetch(url, {
			method: 'POST',
			body: formData,
		});

		var data = await response.json();

		return data.data.question;
	};

	self.addEventListener(
		'message',
		/**
		 * @param {Object} param
		 * @param {WorkerResponse} param.data
		 */
		function ({ data }) {
			self.postMessage({
				action: 'message',
				message:
					"Checking if you're a bot before enabling submit button...",
			});

			var { difficulty, time } = data;
			sendRequest('https://wehatecaptchas.com/api.php').then(
				/** @param {string} question */
				function (question) {
					var verification = [];
					var nonce = nonce ?? 1;

					for (var i = 0; i < difficulty; i++) {
						var response = solveCaptcha({ question, time }, nonce);
						var nonce = response.nonce;
						verification.push(response.verify_array);
						var percentDone = getWholePercent(i + 1, difficulty);
						self.postMessage({
							action: 'message',
							message:
								'Still checking... ' + percentDone + '% done',
						});
					}

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
