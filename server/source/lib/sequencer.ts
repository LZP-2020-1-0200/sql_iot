
export type SequenceItem = {
	optional: string[];
	required: string[];
}


/**
 * A simplified sequencer for the experiment.
 * Takes an array of sequence items and returns a sequence of devices to measure.
 */
export class Sequencer {
	private sequence: SequenceItem[]=[];
	private sequenceIndex: number = 0;
	private waitlist: Set<string> = new Set();
	onMeasure: (device: string) => void = ()=>{};
	onSequence: (sequenceIndex: number) => void = ()=>{};

	/**
	 * 
	 * @param sequence Array of sequence items
	 * @param callback Function that is called when a device should do something
	 */
	constructor(){
		this.sequenceIndex = 0;
		this.waitlist = new Set();
	}

	loadSequence(sequence: SequenceItem[]){
		this.sequence = sequence;
		this.sequenceIndex = 0;
		this.waitlist = new Set();
		if(sequence.length == 0) return;
		for(const device of sequence[0].required){
			this.waitlist.add(device);
		}
	}

	private informDevices(){
		//console.log('Informing devices');
		const sequenceItem = this.sequence[this.sequenceIndex];
		if(sequenceItem === undefined) {
			this.checkReady();
			return;
		}
		const allDevices = [...sequenceItem.required, ...sequenceItem.optional];
		if(allDevices.length === 0) {
			this.checkReady();
			return;
		}
		this.onSequence(this.sequenceIndex);
		for(const device of allDevices){
			//console.log('Informing device ', device);
			this.onMeasure(device);
		}

	}

	private checkReady(){
		//console.log('Checking ready')
		if(this.waitlist.size === 0){
			this.sequenceIndex++;
			// check if we are done with the sequence
			if(this.sequenceIndex > this.sequence.length - 1) return;
			this.informDevices();
			this.waitlist = new Set();
			const sequenceItem = this.sequence[this.sequenceIndex];
			for(const device of sequenceItem.required){
				this.waitlist.add(device);
			}
		}
	}

	isDone(){
		return this.sequenceIndex > this.sequence.length - 1;
	}

	getSequenceIndex(){
		return this.sequenceIndex;
	}

	start(){
		//console.log('Starting sequencer');
		this.sequenceIndex = 0;
		this.waitlist = new Set();
		if(this.sequence.length == 0) return;
		for(const device of this.sequence[0].required){
			this.waitlist.add(device);
		}
		this.informDevices();
	}

	markReady(device: string) {
		this.waitlist.delete(device);
		this.checkReady();
	}
	
}