type whcOptions = {
	button: string;
	form: string;
	difficulty: number;
	finished: string;
	events: boolean;
	perf: boolean;
};

type Verification = {
	nonce: number;
	time: number;
	question: string;
};

type EncodedMessage = {
	M: number[][];
	N: number;
};

type WorkerResponse = {
	action: string;
	message: string;
	difficulty: number;
	time: number;
	verification: Verification[];
	hostname: string;
};

export { whcOptions, Verification, EncodedMessage, WorkerResponse };

interface eventInterface {
	event: string;
	form?: HTMLFormElement;
	button?: HTMLButtonElement;
	difficulty?: number | string;
	verification?: Verification[];
	progress?: number;
	done?: boolean;
	message?: string;
}

export { eventInterface };
