import {Schema} from './Schema';
import {SchemaId} from './CustomTypes/SchemaId';
import {ArrayOf} from './CustomTypes/ArrayOf';
import {OneOf} from './CustomTypes/OneOf';
import {Null} from './CustomTypes/Null';
import {SchemaValue} from './SchemaValue';
import {ClientStore} from './ClientStore';
import {AppState} from './AppState';
import {EventType, StorageType} from './types';
import {DefaultStoreState, withClientStore} from './helpers/with-client-store';

// @ts-ignore
if (window) {
	// @ts-ignore
	window.CWS = {
		Schema,
		SchemaValue,
		SchemaId,
		ArrayOf,
		OneOf,
		Null,
		ClientStore,
		EventType,
		StorageType,
		AppState,
		withClientStore,
		DefaultStoreState
	}
}
