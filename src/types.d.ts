function getSetting(target: HTMLElement, str: string): string | number;

function merge(obj: object): object;

function createWorker(fn: Function): Worker;

function updatePercent(eventInterface: {
	button: HTMLButtonElement;
	message: string;
}): void;

export { getSetting, merge, createWorker, updatePercent };

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
};

export { whcOptions, Verification, EncodedMessage, WorkerResponse };

interface eventInterface {
	event: string;
	form: HTMLFormElement;
	time: number;
	difficulty: number;
	verification: Verification[];
	progress: number;
	done: boolean;
}

export { eventInterface };
