import {Schema, SchemaValue} from './Schema';
import {ClientStore} from './ClientStore';

// @ts-ignore
if (window) {
	// @ts-ignore
	window.Schema = Schema;
	// @ts-ignore
	window.SchemaValue = SchemaValue;
	// @ts-ignore
	window.ClientStore = ClientStore;
}
