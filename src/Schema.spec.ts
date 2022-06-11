import {Schema, SchemaId, SchemaValue} from "./Schema";

describe('SchemaValue', () => {
	it('should create', () => {
		expect((new SchemaValue(Number)).toJSON()).toEqual({
			"defaultValue": 0,
			"required": false,
			"type": "Number"
		})
		expect((new SchemaValue(Number)).toString()).toEqual("{\n" +
			"    \"type\": \"Number\",\n" +
			"    \"required\": false,\n" +
			"    \"defaultValue\": 0\n" +
			"}")
		expect((new SchemaValue(SchemaId, true)).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": null,
			"required": true,
			"type": "SchemaId"
		}))
		expect((new SchemaValue(String, false, "sample")).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": "sample",
			"required": false,
			"type": "String"
		}))
	});
	
	it('should throw error if invalid default value type', () => {
		expect(() => new SchemaValue(String, false, 12)).toThrowError(`Default value "12" does not match type "String"`)
		expect(() => new SchemaValue(SchemaId, true, "sample")).toThrowError(`Default value "sample" does not match type "SchemaId"`)
		expect(() => new SchemaValue(SchemaId, true, {} as any)).toThrowError(`Default value "[object Object]" does not match type "SchemaId"`)
	});
})

describe('Schema', () => {
	describe('should handle simple types', () => {
		interface ToDo extends Schema.DefaultValue {
			name: string;
			description: string;
			userId: number;
			selected: boolean;
			state: string;
		}
		
		let todoSchema: Schema<ToDo>;
		
		beforeEach(() => {
			todoSchema = new Schema("todo");
			
			todoSchema.defineField("name", String, {required: true});
			todoSchema.defineField("description", String);
			todoSchema.defineField("userId", SchemaId, {required: true});
			todoSchema.defineField("selected", Boolean);
			todoSchema.defineField("state", String);
		})
		
		it('should return correct JSON value', () => {
			expect(todoSchema.toJSON()).toEqual(expect.objectContaining({
				"createdDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				},
				"description": {
					"defaultValue": "",
					"required": false,
					"type": "String"
				},
				"id": {
					"defaultValue": null,
					"required": false,
					"type": "SchemaId"
				},
				"lastUpdatedDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				},
				"name": {
					"defaultValue": "",
					"required": true,
					"type": "String"
				},
				"selected": {
					"defaultValue": false,
					"required": false,
					"type": "Boolean"
				},
				"state": {
					"defaultValue": "",
					"required": false,
					"type": "String"
				},
				"userId": {
					"defaultValue": null,
					"required": true,
					"type": "SchemaId"
				}
			}));
		});
		
		it('should return correct value', () => {
			expect(todoSchema.toValue()).toEqual(expect.objectContaining({
				"createdDate": expect.any(Date),
				"description": "",
				"id": expect.any(Number),
				"lastUpdatedDate": expect.any(Date),
				"name": "",
				"selected": false,
				"state": "",
				"userId": null
			}))
		});
		
		it('should remove field', () => {
			todoSchema.removeField("selected");
			
			expect(todoSchema.getField("selected")).toBeNull()
		});
		
		it('should check field', () => {
			expect(todoSchema.hasField("description")).toBeTruthy()
			// @ts-ignore
			expect(todoSchema.hasField("deletedDae")).toBeFalsy()
		});
		
		it('should update field', () => {
			expect(todoSchema.getField("state")).toEqual({"defaultValue": "", "required": false, "type": String});
			
			todoSchema.defineField("state", Number, {defaultValue: 5});
			
			expect(todoSchema.getField("state")).toEqual({"defaultValue": 5, "required": false, "type": Number})
		});
		
		it('should check for valid field value', () => {
			todoSchema.defineField("state", Number, {defaultValue: 5});
			
			expect(todoSchema.isValidFieldValue("state", 120)).toBeTruthy()
			expect(todoSchema.isValidFieldValue("state", "sample")).toBeFalsy()
			expect(todoSchema.isValidFieldValue("state")).toBeTruthy()
			
			expect(todoSchema.isValidFieldValue("name", "sample")).toBeTruthy()
			expect(todoSchema.isValidFieldValue("name", 120)).toBeFalsy()
			expect(todoSchema.isValidFieldValue("name")).toBeFalsy()
			
			expect(todoSchema.isValidFieldValue("selected", true)).toBeTruthy()
			expect(todoSchema.isValidFieldValue("selected", "sample")).toBeFalsy()
			expect(todoSchema.isValidFieldValue("selected")).toBeTruthy()
			
			expect(todoSchema.isValidFieldValue("userId", new SchemaId())).toBeTruthy()
			expect(todoSchema.isValidFieldValue("userId", "sample")).toBeFalsy()
			expect(todoSchema.isValidFieldValue("userId")).toBeFalsy()
		});
		
		it('should check if data matches schema', () => {
			expect(todoSchema.getInvalidSchemaDataFields({
				name: "My todo"
			})).toEqual(["userId"])
			expect(todoSchema.getInvalidSchemaDataFields({
				name: "My todo",
				userId: new SchemaId()
			})).toEqual([])
		});
	});
	
	describe("should handle complex types", () => {
		it('Blob', () => {
			interface DT extends Schema.DefaultValue {
				data: Blob;
			}
			
			const blob = new Blob(['<a id="a"><b id="b">hey!</b></a>'], {type: 'text/html'});
			
			const blobSchema = new Schema<DT>("blob", {
				data: new SchemaValue(Blob)
			})
			
			expect(blobSchema.toJSON()).toEqual(expect.objectContaining({
				"createdDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				},
				"data": {
					"defaultValue": null,
					"required": false,
					"type": "Blob"
				},
				"id": {
					"defaultValue": null,
					"required": false,
					"type": "SchemaId"
				},
				"lastUpdatedDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				}
			}))
			expect(blobSchema.isValidFieldValue("data", blob)).toBeTruthy()
			expect(blobSchema.isValidFieldValue("data", 12)).toBeFalsy()
			expect(blobSchema.getInvalidSchemaDataFields({
				data: 12,
				new: "yes"
			})).toEqual(["data", "new"])
			expect(blobSchema.getInvalidSchemaDataFields({
				data: blob,
				new: "yes"
			})).toEqual(["new"])
			expect(blobSchema.getInvalidSchemaDataFields({
				data: blob,
			})).toEqual([])
		});
		
		it('Array', () => {
			interface DT extends Schema.DefaultValue {
				data: [];
			}
			
			const arraySchema = new Schema<DT>("array", {
				data: new SchemaValue(Array)
			})
			
			expect(arraySchema.toJSON()).toEqual(expect.objectContaining({
				"createdDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				},
				"data": {
					"defaultValue": [],
					"required": false,
					"type": "Array"
				},
				"id": {
					"defaultValue": null,
					"required": false,
					"type": "SchemaId"
				},
				"lastUpdatedDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				}
			}))
			expect(arraySchema.isValidFieldValue("data", [12, true, new SchemaId()])).toBeTruthy()
			expect(arraySchema.isValidFieldValue("data", [12, {}, "sample"])).toBeFalsy()
			expect(arraySchema.isValidFieldValue("data", true)).toBeFalsy()
			expect(arraySchema.getInvalidSchemaDataFields({
				data: 12,
				new: "yes"
			})).toEqual(["data", "new"])
			expect(arraySchema.getInvalidSchemaDataFields({
				data: [12, true, {}],
				obj: "yes"
			})).toEqual(["data", "obj"])
			expect(arraySchema.getInvalidSchemaDataFields({
				data: [12, true],
			})).toEqual([])
		});
		
		it('Int32Array', () => {
			interface DT extends Schema.DefaultValue {
				data: Int32Array;
			}
			
			const in32Array = new Int32Array([12, 45]);
			
			const in32ArraySchema = new Schema<DT>("in32Array", {
				data: new SchemaValue(Int32Array)
			})
			
			expect(in32ArraySchema.toJSON()).toEqual(expect.objectContaining({
				"createdDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				},
				"data": {
					"defaultValue": expect.any(Int32Array),
					"required": false,
					"type": "Int32Array"
				},
				"id": {
					"defaultValue": null,
					"required": false,
					"type": "SchemaId"
				},
				"lastUpdatedDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				}
			}))
			expect(in32ArraySchema.isValidFieldValue("data", in32Array)).toBeTruthy()
			expect(in32ArraySchema.isValidFieldValue("data", "sample")).toBeFalsy()
			expect(in32ArraySchema.getInvalidSchemaDataFields({
				data: 12,
				new: "yes"
			})).toEqual(["data", "new"])
			expect(in32ArraySchema.getInvalidSchemaDataFields({
				data: in32Array,
				new: "yes"
			})).toEqual(["new"])
			expect(in32ArraySchema.getInvalidSchemaDataFields({
				data: in32Array,
			})).toEqual([])
		});
	})
	
	it('should handle nested schemas', () => {
		interface ToDo extends Schema.DefaultValue {
			name: string;
			description: string;
			user: {
				name: string;
				avatar: string;
			};
			selected: boolean;
			state: string;
		}

		const userSchema = new Schema("user", {
			name: new SchemaValue(String, true),
			avatar: new SchemaValue(String),
		});
		const todoSchema = new Schema<ToDo>("todo", {
			name: new SchemaValue(String, true),
			description: new SchemaValue(String),
			user: new SchemaValue(userSchema, true),
			selected: new SchemaValue(Boolean),
			state: new SchemaValue(String),
		});

		expect(todoSchema.toJSON()).toEqual(expect.objectContaining({
			"createdDate": {
				"defaultValue": null,
				"required": false,
				"type": "Date"
			},
			"description": {
				"defaultValue": "",
				"required": false,
				"type": "String"
			},
			"id": {
				"defaultValue": null,
				"required": false,
				"type": "SchemaId"
			},
			"lastUpdatedDate": {
				"defaultValue": null,
				"required": false,
				"type": "Date"
			},
			"name": {
				"defaultValue": "",
				"required": true,
				"type": "String"
			},
			"selected": {
				"defaultValue": false,
				"required": false,
				"type": "Boolean"
			},
			"state": {
				"defaultValue": "",
				"required": false,
				"type": "String"
			},
			"user": {
				"defaultValue": null,
				"required": true,
				"type": {
					"avatar": {
						"defaultValue": "",
						"required": false,
						"type": "String",
					},
					"createdDate": {
						"defaultValue": null,
						"required": false,
						"type": "Date"
					},
					"id": {
						"defaultValue": null,
						"required": false,
						"type": "SchemaId"
					},
					"lastUpdatedDate": {
						"defaultValue": null,
						"required": false,
						"type": "Date"
					},
					"name": {
						"defaultValue": "",
						"required": true,
						"type": "String"
					}
				}
			}
		}))
		expect(todoSchema.toValue()).toEqual(expect.objectContaining({
			"createdDate": expect.any(Date),
			"description": "",
			"id": expect.any(Number),
			"lastUpdatedDate": expect.any(Date),
			"name": "",
			"selected": false,
			"state": "",
			"user": {
				"avatar": "",
				"createdDate": expect.any(Date),
				"id": expect.any(Number),
				"lastUpdatedDate": expect.any(Date),
				"name": "",
			}
		}))
		expect(todoSchema.getInvalidSchemaDataFields({})).toEqual(["name", "user"])
		expect(todoSchema.getInvalidSchemaDataFields({
			name: "my todo"
		})).toEqual(["user"])
		expect(todoSchema.getInvalidSchemaDataFields({
			name: "my todo",
			user: {}
		})).toEqual(["user.name"])
		expect(todoSchema.getInvalidSchemaDataFields({
			name: "my todo",
			user: {
				name: "John Doe"
			}
		})).toEqual([])
		expect(todoSchema.isValidFieldValue("user", {})).toBeFalsy();
		expect(todoSchema.isValidFieldValue("user", {
			name: 'sample'
		})).toBeTruthy();
		expect(todoSchema.getField("user.avatar")?.toJSON()).toEqual({
			"defaultValue": "",
			"required": false,
			"type": "String"
		})
		
		expect(todoSchema.hasField("user.avatar")).toBeTruthy()
		
		todoSchema.removeField("user.avatar");
		
		expect(todoSchema.hasField("user.avatar")).toBeFalsy()
		expect(todoSchema.getField("user")?.toJSON()).toEqual(expect.objectContaining({
			"defaultValue": null,
			"required": true,
			"type": {
				"createdDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				},
				"id": {
					"defaultValue": null,
					"required": false,
					"type": "SchemaId"
				},
				"lastUpdatedDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				},
				"name": {
					"defaultValue": "",
					"required": true,
					"type": "String"
				}
			}
		}));
	});
});
