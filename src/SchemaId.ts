import {generateUUID} from "./utils/generate-uuid";

export class SchemaId {
	value = (() => {
		try {
			return crypto.randomUUID();
		} catch (e) {
			return generateUUID();
		}
	})();
}