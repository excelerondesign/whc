(function (factory) {
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}((function () {
	function emit (element, eventType, detail) {
	  if (detail === void 0) {
	    detail = {};
	  }

	  var event = new CustomEvent(eventType, {
	    bubbles: true,
	    detail: detail
	  });
	  element.dispatchEvent(event);
	}

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
	function worker () {
	  // 0xffffffff is an unsigned int, a constant which is not present in javascrript
	  function utilities() {}

	  utilities.prototype = {
	    // constants [§4.2.2]

	    /** @const {number[]} K */
	    K: [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2],
	    // initial hash value [§5.3.1]

	    /** @const {number[]} H */
	    H: [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19],

	    /**
	     * @param {number} n
	     */
	    _toHexString: function _toHexString(n) {
	      var s = '',
	          v;

	      for (var i = 7; i >= 0; i--) {
	        v = n >>> i * 4 & 0xf;
	        s += v.toString(16);
	      }

	      return s;
	    },

	    /**
	     * @param {number} n
	     * @param {number} x
	     */
	    _ROTR: function _ROTR(n, x) {
	      return x >>> n | x << 32 - n;
	    },

	    /**
	     * @param {number} x
	     */
	    _Sigma0: function _Sigma0(x) {
	      return this._ROTR(2, x) ^ this._ROTR(13, x) ^ this._ROTR(22, x);
	    },

	    /**
	     * @param {number} x
	     */
	    _Sigma1: function _Sigma1(x) {
	      return this._ROTR(6, x) ^ this._ROTR(11, x) ^ this._ROTR(25, x);
	    },

	    /**
	     * @param {number} x
	     * */
	    _sigma0: function _sigma0(x) {
	      return this._ROTR(7, x) ^ this._ROTR(18, x) ^ x >>> 3;
	    },

	    /** @param {number} x */
	    _sigma1: function _sigma1(x) {
	      return this._ROTR(17, x) ^ this._ROTR(19, x) ^ x >>> 10;
	    },

	    /**
	     * @param {number} x
	     * @param {number} y
	     * @param {number} z
	     */
	    _Ch: function _Ch(x, y, z) {
	      return x & y ^ ~x & z;
	    },

	    /**
	     * @param {number} x
	     * @param {number} y
	     * @param {number} z
	     */
	    _Maj: function _Maj(x, y, z) {
	      return x & y ^ x & z ^ y & z;
	    }
	  };
	  /**
	   * Contains all the hashing functions for sha256 algorithm
	   */

	  function sha256() {
	    /**
	     * @param {string} msg
	     * @returns {EncodedMessage}
	     */
	    this._encodeMessage = function (msg) {
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
	          M[i][j] = msg.charCodeAt(i * 64 + j * 4) << 24 | msg.charCodeAt(i * 64 + j * 4 + 1) << 16 | msg.charCodeAt(i * 64 + j * 4 + 2) << 8 | msg.charCodeAt(i * 64 + j * 4 + 3);
	        } // note running off the end of msg is ok 'cos bitwise ops on NaN return 0

	      } // add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
	      // note: most significant word would be (len-1)*8 >>> 32, but since JS converts
	      // bitwise-op args to 32 bits, we need to simulate this by arithmetic operators


	      M[N - 1][14] = (msg.length - 1) * 8 / Math.pow(2, 32);
	      M[N - 1][14] = Math.floor(M[N - 1][14]);
	      M[N - 1][15] = (msg.length - 1) * 8 & 0xffffffff;
	      return {
	        M: M,
	        N: N
	      };
	    };
	    /**
	     * @param {EncodedMessage} encodedMessage
	     * @param {number[]} H
	     * @param {number[]} K
	     * @return {string[]}
	     */


	    this._computeHash = function (_ref, H, K) {
	      var _this = this;

	      var M = _ref.M,
	          N = _ref.N;
	      var W = new Array(64);
	      var a, b, c, d, e, f, g, h;

	      for (var i = 0; i < N; i++) {
	        // 1 - prepare message schedule 'W'
	        for (var t = 0; t < 16; t++) {
	          W[t] = M[i][t];
	        }

	        for (var t = 16; t < 64; t++) {
	          W[t] = this._sigma1(W[t - 2]) + W[t - 7] + this._sigma0(W[t - 15]) + W[t - 16] & 0xffffffff;
	        } // 2 - initialise working variables a, b, c, d, e, f, g, h with previous hash value


	        a = H[0];
	        b = H[1];
	        c = H[2];
	        d = H[3];
	        e = H[4];
	        f = H[5];
	        g = H[6];
	        h = H[7]; // 3 - main loop (note 'addition modulo 2^32')

	        for (var t = 0; t < 64; t++) {
	          var T1 = h + this._Sigma1(e) + this._Ch(e, f, g) + K[t] + W[t];

	          var T2 = this._Sigma0(a) + this._Maj(a, b, c);

	          h = g;
	          g = f;
	          f = e;
	          e = d + T1 & 0xffffffff;
	          d = c;
	          c = b;
	          b = a;
	          a = T1 + T2 & 0xffffffff;
	        } // 4 - compute the new intermediate hash value (note 'addition modulo 2^32')


	        H[0] = H[0] + a & 0xffffffff;
	        H[1] = H[1] + b & 0xffffffff;
	        H[2] = H[2] + c & 0xffffffff;
	        H[3] = H[3] + d & 0xffffffff;
	        H[4] = H[4] + e & 0xffffffff;
	        H[5] = H[5] + f & 0xffffffff;
	        H[6] = H[6] + g & 0xffffffff;
	        H[7] = H[7] + h & 0xffffffff;
	      }

	      var hashMap = H.map(function (hash) {
	        return _this._toHexString(hash);
	      });
	      return hashMap;
	    };
	    /**
	     * @param {string|number} msg
	     * @returns {string}
	     */


	    this.hash = function (msg) {
	      var encodedMessage = this._encodeMessage(msg);

	      var intermediateHash = this._computeHash(encodedMessage, this.H, this.K);

	      var hashedString = intermediateHash.join('');
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

	  var getWholePercent = function getWholePercent(percentFor, percentOf) {
	    return Math.floor(percentFor / percentOf * 100);
	  };
	  /** @param {number} value */


	  var isPrime = function isPrime(value) {
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


	  var solveCaptcha = function solveCaptcha(_ref2, nonce) {
	    var question = _ref2.question,
	        time = _ref2.time;

	    if (nonce === void 0) {
	      nonce = 1;
	    }

	    nonce++;
	    var verifyArray = {
	      question: question,
	      time: time,
	      nonce: nonce
	    };
	    var currentHash = sha.hash(JSON.stringify(verifyArray));

	    while (currentHash.substr(0, 4) !== '0000' || !isPrime(nonce)) {
	      nonce++;
	      var verifyArray = {
	        question: question,
	        time: time,
	        nonce: nonce
	      };
	      var currentHash = sha.hash(JSON.stringify(verifyArray));
	    }

	    return {
	      verify_array: verifyArray,
	      nonce: nonce,
	      hash: currentHash
	    };
	  };
	  /**
	   * @param {string} url
	   * @returns {string}
	   */


	  var sendRequest = function sendRequest() {
	    try {
	      var formData = new FormData();
	      formData.append('endpoint', 'question');
	      return Promise.resolve(fetch('https://wehatecaptchas.com/api.php', {
	        method: 'POST',
	        body: formData
	      })).then(function (response) {
	        return Promise.resolve(response.json()).then(function (data) {
	          return data.data.question;
	        });
	      });
	    } catch (e) {
	      return Promise.reject(e);
	    }
	  };

	  self.addEventListener('message',
	  /**
	   * @param {Object} param
	   * @param {WorkerResponse} param.data
	   */
	  function (_ref3) {
	    var data = _ref3.data;
	    self.postMessage({
	      action: 'message',
	      message: "Checking if you're a bot before enabling submit button..."
	    });
	    var difficulty = data.difficulty,
	        time = data.time;
	    sendRequest().then(
	    /** @param {string} question */
	    function (question) {
	      var _nonce;

	      var verification = [];
	      var nonce = (_nonce = nonce) != null ? _nonce : 1;

	      for (var i = 0; i < difficulty; i++) {
	        var response = solveCaptcha({
	          question: question,
	          time: time
	        }, nonce);
	        var nonce = response.nonce;
	        verification.push(response.verify_array);
	        var percentDone = getWholePercent(i + 1, difficulty);
	        self.postMessage({
	          action: 'message',
	          message: 'Still checking... ' + percentDone + '% done'
	        });
	      }

	      self.postMessage({
	        action: 'captchaSuccess',
	        verification: verification
	      });
	      verification = [];
	      nonce = 1;
	    });
	  }, false);
	}

	/*!
	 * WeHateCaptchas Self-Instantiating-Plugin
	 * (c) 2020 Exceleron Designs, MIT License, https://excelerondesigns.com
	 */

	(function () {
	  /**
	   * A weird bug in firefox leads to web workers with no "Active reference" to be garbage collected
	   * So we create a global array to push workers into so that they don't get collected
	   * once the workers complete their job, they are splice from the array
	   * and terminated
	   */
	  window.whcWorkers = [];
	  /**
	   * @type {whcOptions}
	   */

	  var whcDefaults = {
	    button: '[type="submit"]',
	    form: '.whc-form',
	    difficulty: 3,
	    finished: 'Submit',
	    events: true
	  };
	  /**
	   * @type {whcOptions}
	   */

	  var windowWhcConfig = window.whcConfig || {};
	  /**
	   * @type {whcOptions}
	   */

	  var whcConfig = Object.assign(whcDefaults, windowWhcConfig);
	  /**
	   * @type {NodeListOf<HTMLFormElement>}
	   */

	  var forms = document.querySelectorAll(whcConfig.form);
	  /**
	   * @param {string} str
	   */

	  var parse = function parse(str) {
	    var num = parseInt(str);
	    if (isNaN(num)) return false;
	    if (num !== num) return false;
	    return num;
	  };
	  /**
	   * @class
	   * @param {HTMLFormElement} form
	   * @param {number} index
	   */


	  var Constructor = function Constructor(form, index) {
	    var Private = {};
	    /**
	     * @type {number} Now converted to seconds
	     */

	    Private.time = Math.floor(Date.now() / 1000);
	    /**
	     * @type {HTMLFormElement}
	     */

	    Private.form = form;
	    /**
	     * @type {string}
	     */

	    Private.ID = form.getAttribute('id') || 'Form ' + index;
	    /**
	     * @type {HTMLButtonElement}
	     */

	    Private.button = form.querySelector(whcConfig.button);
	    /**
	     * @type {number}
	     */

	    Private.difficulty = parse(Private.button.getAttribute('data-difficulty')) || whcConfig.difficulty;
	    /**
	     * @param {HTMLButtonElement} button
	     */

	    var enableButton = function enableButton(button) {
	      var finished = button.dataset.finished;
	      button.classList.add('done');
	      button.removeAttribute('disabled');
	      button.setAttribute('value', finished);
	    };

	    var createWorker = function createWorker() {
	      try {
	        // generates a worker by converting  into a string and then running that function as a worker
	        var blob = new Blob(['(' + worker.toString() + ')();'], {
	          type: 'application/javascript'
	        });
	        var blobUrl = URL.createObjectURL(blob);
	        var laborer = new Worker(blobUrl);
	        window.whcWorkers.push(laborer);
	        return laborer;
	      } catch (e1) {
	        throw new Error('Uknown Error: ' + e1);
	      }
	    };

	    var removeWorker = function removeWorker(worker) {
	      worker.terminate();
	      var workerIndex = window.whcWorkers.indexOf(worker);
	      window.whcWorkers.splice(workerIndex, 1);
	    };

	    Private.worker = createWorker();

	    var beginVerification = function beginVerification() {
	      var difficulty = Private.difficulty,
	          time = Private.time,
	          worker = Private.worker;
	      worker.postMessage({
	        difficulty: difficulty,
	        time: time
	      });
	    };
	    /**
	     * @param {HTMLFormElement} form
	     * @param {Verification} verification
	     */


	    var addVerification = function addVerification(form, verification) {
	      var input = document.createElement('input');
	      input.setAttribute('type', 'hidden');
	      input.setAttribute('name', 'captcha_verification');
	      input.setAttribute('value', JSON.stringify(verification));
	      form.appendChild(input);

	      if (whcConfig.events) {
	        emit(Private.form, 'WHC::Verification', {
	          form: Private.form,
	          verification: verification
	        });
	      }
	    };
	    /**
	     * @param {HTMLButtonElement} button
	     * @param {string} string
	     */


	    var updatePercent = function updatePercent(button, string) {
	      var percent = string.match(/\d{2,3}/);
	      if (percent === null) return;
	      button.setAttribute('data-progress', percent + '%');
	      if (whcConfig.events) emit(Private.form, 'WHC::Progress', {
	        progress: percent + '%',
	        complete: percent[0] === '100'
	      });
	    };
	    /**
	     * @param {Object} param
	     * @param {WorkerResponse} param.data
	     */


	    var workerMessageHandler = function workerMessageHandler(_ref) {
	      var data = _ref.data;

	      if (data.action === 'captchaSuccess') {
	        addVerification(Private.form, data.verification);
	        enableButton(Private.button);
	        removeWorker(Private.worker);
	        return;
	      }

	      if (data.action === 'message') {
	        updatePercent(Private.button, data.message);
	        return;
	      }
	    };

	    window.addEventListener('load', beginVerification, {
	      once: true,
	      capture: true
	    });
	    Private.worker.addEventListener('message', workerMessageHandler, false);
	    if (whcConfig.events) emit(Private.form, 'WHC::Initialize', {
	      form: Private.form,
	      ID: Private.ID,
	      button: Private.button,
	      difficulty: Private.difficulty
	    });
	  };

	  forms.forEach(function (form, i) {
	    return new Constructor(form, i);
	  });
	})();

})));
