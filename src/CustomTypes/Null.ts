import {CustomType} from "./CustomType";

export const Null = class extends CustomType {
	constructor() {
		super('Null', null, null);
	}
}

Object.defineProperty(Null, 'name', {value: 'Null'})
