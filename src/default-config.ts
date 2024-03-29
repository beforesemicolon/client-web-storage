import {MEMORYSTORAGE} from "./MemoryStore";
import {Config} from "./types";

export const defaultConfig: Config = {
	version: 1,
	type: MEMORYSTORAGE,
	description: "",
	appName: "App",
	idKeyName: "_id",
	createdDateKeyName: "_createdDate",
	updatedDateKeyName: "_lastUpdatedDate",
}
