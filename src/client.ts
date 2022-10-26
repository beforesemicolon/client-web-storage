import {Schema} from './Schema';
import {SchemaId} from './SchemaId';
import {SchemaValue} from './SchemaValue';
import {ClientStore} from './ClientStore';

// @ts-ignore
if (window) {
	// @ts-ignore
	window.Schema = Schema;
	// @ts-ignore
	window.SchemaValue = SchemaValue;
	// @ts-ignore
	window.SchemaId = SchemaId;
	// @ts-ignore
	window.ClientStore = ClientStore;
}
