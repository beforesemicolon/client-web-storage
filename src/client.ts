import {Schema} from './Schema';
import {SchemaId} from './CustomTypes/SchemaId';
import {ArrayOf} from './CustomTypes/ArrayOf';
import {OneOf} from './CustomTypes/OneOf';
import {SchemaValue} from './SchemaValue';
import {ClientStore} from './ClientStore';
import {AppState} from './AppState';
import {EventType, StorageType} from './types';

// @ts-ignore
if (window) {
	// @ts-ignore
	window.CWS = {
		Schema,
		SchemaValue,
		SchemaId,
		ArrayOf,
		OneOf,
		ClientStore,
		EventType,
		StorageType,
		AppState
	}
}
