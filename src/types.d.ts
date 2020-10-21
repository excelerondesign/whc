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

export { Verification, EncodedMessage, WorkerResponse };

interface eventInterface {
	event: string;
	form?: HTMLFormElement;
	difficulty?: number | string;
	verification?: Verification[];
	progress?: number;
	done?: boolean;
	message?: string;
}

export { eventInterface };
