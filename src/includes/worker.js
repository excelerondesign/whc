import sha256 from './sha256';

export default function () {
    const getWholePercent = (percentFor, percentOf) => {
        return Math.floor((percentFor / percentOf) * 100);
    };
    const isPrime = value => {
        for (var i = 2; i < value; i++) {
            if (value % i === 0) {
                return false;
            }
        }
        return value > 1;
    };

    const solveCaptcha = (data, nonce = 1) => {
        nonce++;
        var verifyArray = {
            question: data.question,
            time: data.time,
            nonce: nonce
        };
        var verifyJson = JSON.stringify(verifyArray);
        var currentHash = sha256(verifyJson);
        while (currentHash.substr(0, 4) !== "0000" || !isPrime(nonce)) {
            nonce++;
            var verifyArray = {
                question: data.question,
                time: data.time,
                nonce: nonce
            };
            var verifyJson = JSON.stringify(verifyArray);
            var currentHash = sha256(verifyJson);
        }
        return {
            verify_array: verifyArray,
            nonce: nonce,
            hash: currentHash
        };
    };
    var verification = [];
    if (nonce === null) {
        var nonce = 1;
    }
    self.addEventListener(
        "message",
        function (e) {
            var data = e.data;
            self.postMessage({
                action: "message",
                message: `Checking if you're a bot before enabling submit button...`
            });
            var times = data.difficulty;
            for (var i = 0; i < times; i++) {
                var response = solveCaptcha(data, nonce);
                var nonce = response.nonce;
                verification.push(response.verify_array);
                var percentDone = getWholePercent(i + 1, times);
                self.postMessage({
                    action: "message",
                    message: `Still checking... ${percentDone}% done`
                });
            }
            self.postMessage({
                action: "captchaSuccess",
                verification: verification
            });
            verification = [];
            nonce = 1;
        },
        false
    );
};
