import {Schema} from "./Schema";
import {SchemaDefaultValues} from "./types";
import {SchemaId} from "./CustomTypes/SchemaId";
import {SchemaValue} from "./SchemaValue";
import {ArrayOf} from "./CustomTypes/ArrayOf";
import {OneOf} from "./CustomTypes/OneOf";

describe('Schema', () => {
	it('should fail if obj is invalid', () => {
		expect(() => new Schema('sample', {
			// @ts-ignore
			val: Symbol('invalid')
		})).toThrowError('Field "val" is not a SchemaValue')
	});
	
	describe('should handle simple types', () => {
		interface ToDo extends SchemaDefaultValues {
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
		
		it('should get the name', () => {
			expect(todoSchema.name).toBe('todo')
		});
		
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
					"defaultValue": expect.any(String),
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
					"defaultValue": expect.any(String),
					"required": true,
					"type": "SchemaId"
				}
			}));
		});
		
		it('should return correct value', () => {
			expect(todoSchema.toValue()).toEqual({
				"createdDate": expect.any(Date),
				"description": "",
				"id": expect.any(String),
				"lastUpdatedDate": expect.any(Date),
				"name": "",
				"selected": false,
				"state": "",
				"userId": expect.any(String)
			})
		});
		
		it('should remove field', () => {
			todoSchema.removeField("selected");
			
			expect(todoSchema.getField("selected")).toBeNull()
		});
		
		it('should check field', () => {
			expect(todoSchema.hasField("description")).toBeTruthy()
			expect(todoSchema.getField("description")).toEqual( new SchemaValue(String))
			// @ts-ignore
			expect(todoSchema.hasField("deletedDae")).toBeFalsy()
			expect(todoSchema.getField("deletedDae")).toBe(null)
			expect(todoSchema.getField("")).toBe(null)
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
			expect(todoSchema.isValidFieldValue("state")).toBeFalsy()
			
			expect(todoSchema.isValidFieldValue("name", "sample")).toBeTruthy()
			expect(todoSchema.isValidFieldValue("name", 120)).toBeFalsy()
			expect(todoSchema.isValidFieldValue("name")).toBeFalsy()
			
			expect(todoSchema.isValidFieldValue("selected", true)).toBeTruthy()
			expect(todoSchema.isValidFieldValue("selected", "sample")).toBeFalsy()
			expect(todoSchema.isValidFieldValue("selected")).toBeFalsy()
			
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
			interface DT extends SchemaDefaultValues {
				data: Blob;
			}
			
			const blob = new Blob(['<a id="a"><b id="b">hey!</b></a>'], {type: 'text/html'});
			
			const blobSchema = new Schema<DT>("blob", {
				data: new SchemaValue(Blob)
			})
			
			expect(blobSchema.toJSON()).toEqual({
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
					"defaultValue": expect.any(String),
					"required": false,
					"type": "SchemaId"
				},
				"lastUpdatedDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				}
			})
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
			interface DT extends SchemaDefaultValues {
				data: [];
			}
			
			const arraySchema = new Schema<DT>("array", {
				data: new SchemaValue(Array)
			})
			
			expect(arraySchema.toJSON()).toEqual({
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
					"defaultValue": expect.any(String),
					"required": false,
					"type": "SchemaId"
				},
				"lastUpdatedDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				}
			})
			expect(arraySchema.isValidFieldValue("data", [12, true, new SchemaId()])).toBeTruthy()
			expect(arraySchema.isValidFieldValue("data", [12, {}, "sample"])).toBeTruthy()
			expect(arraySchema.isValidFieldValue("data", true)).toBeFalsy()
			expect(arraySchema.getInvalidSchemaDataFields({
				data: 12,
				new: "yes"
			})).toEqual(["data", "new"])
			expect(arraySchema.getInvalidSchemaDataFields({
				data: [12, true, {}],
				obj: "yes"
			})).toEqual(["obj"])
			expect(arraySchema.getInvalidSchemaDataFields({
				data: [12, true],
			})).toEqual([])
		});

		it('ArrayOf', () => {
			interface DT extends SchemaDefaultValues {
				data: Array<Number>;
			}

			const arraySchema = new Schema<DT>("array", {
				data: new SchemaValue(ArrayOf(Number), true)
			})

			expect(arraySchema.toJSON()).toBeDefined()
			expect(arraySchema.toJSON()).toEqual({
				"createdDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				},
				"data": {
					"defaultValue": [],
					"required": true,
					"type": "Array<Number>"
				},
				"id": {
					"defaultValue": expect.any(String),
					"required": false,
					"type": "SchemaId"
				},
				"lastUpdatedDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				}
			})
			expect(arraySchema.isValidFieldValue("data", [12])).toBeTruthy()
			expect(arraySchema.isValidFieldValue("data", [new Number(99), 33])).toBeTruthy()
			expect(arraySchema.isValidFieldValue("data", [12, 34, 66])).toBeTruthy()
			expect(arraySchema.isValidFieldValue("data", [12, true, new SchemaId()])).toBeFalsy()
			expect(arraySchema.isValidFieldValue("data", [12, {}, "sample"])).toBeFalsy()
			expect(arraySchema.isValidFieldValue("data", true)).toBeFalsy()
			expect(arraySchema.getInvalidSchemaDataFields({
				new: "yes"
			})).toEqual(["new", "data"])
			expect(arraySchema.getInvalidSchemaDataFields({
				data: [12, true, {}],
				obj: "yes"
			})).toEqual(["data", "obj"])
			expect(arraySchema.getInvalidSchemaDataFields({
				data: [12, 88],
			})).toEqual([])
			expect(arraySchema.getInvalidSchemaDataFields({
				data: [],
			})).toEqual([])
		});
		
		it('OneOf', () => {
			interface DT extends SchemaDefaultValues {
				data: Array<Number>;
			}
			
			const arraySchema = new Schema<DT>("array", {
				data: new SchemaValue(OneOf(Number, String))
			})
			
			expect(arraySchema.toJSON()).toBeDefined()
			expect(arraySchema.toJSON()).toEqual({
				"createdDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				},
				"data": {
					"defaultValue": null,
					"required": false,
					"type": "OneOf<Number, String>"
				},
				"id": {
					"defaultValue": expect.any(String),
					"required": false,
					"type": "SchemaId"
				},
				"lastUpdatedDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				}
			})
			expect(arraySchema.isValidFieldValue("data", [12])).toBeFalsy()
			expect(arraySchema.isValidFieldValue("data", new Number(99))).toBeTruthy()
			expect(arraySchema.isValidFieldValue("data", 34)).toBeTruthy()
			expect(arraySchema.isValidFieldValue("data", new String("sample"))).toBeTruthy()
			expect(arraySchema.isValidFieldValue("data", "sample")).toBeTruthy()
			expect(arraySchema.getInvalidSchemaDataFields({
				new: "yes"
			})).toEqual(["new"])
			expect(arraySchema.getInvalidSchemaDataFields({
				data: 12,
				obj: "yes"
			})).toEqual(["obj"])
			expect(arraySchema.getInvalidSchemaDataFields({
				data: "sample",
			})).toEqual([])
			expect(arraySchema.getInvalidSchemaDataFields({
				data: null,
			})).toEqual(["data"])
		});
		
		it('ArrayBuffer', () => {
			interface DT extends SchemaDefaultValues {
				data: ArrayBuffer;
			}
			
			const arraySchema = new Schema<DT>("arrayBuffer", {
				data: new SchemaValue(ArrayBuffer)
			})
			
			expect(arraySchema.toJSON()).toEqual({
				"createdDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				},
				"data": {
					"defaultValue": null,
					"required": false,
					"type": "ArrayBuffer"
				},
				"id": {
					"defaultValue": expect.any(String),
					"required": false,
					"type": "SchemaId"
				},
				"lastUpdatedDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				}
			})
			expect(arraySchema.isValidFieldValue("data", new ArrayBuffer(10))).toBeTruthy()
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
				data: new ArrayBuffer(0),
			})).toEqual([])
		});
		
		it('Int32Array', () => {
			interface DT extends SchemaDefaultValues {
				data: Int32Array;
			}
			
			const in32Array = new Int32Array([12, 45]);
			
			const in32ArraySchema = new Schema<DT>("in32Array", {
				data: new SchemaValue(Int32Array)
			})
			
			expect(in32ArraySchema.toJSON()).toEqual({
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
					"defaultValue": expect.any(String),
					"required": false,
					"type": "SchemaId"
				},
				"lastUpdatedDate": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				}
			})
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
	
	describe('should handle no default values schema', () => {
		interface ParkingTicket extends SchemaDefaultValues {
			ticketId: SchemaId;
			arrivalTime: Date;
			departureTime: Date;
		}
		
		let parkingTicketSchema: Schema<ParkingTicket>;
		
		beforeEach(() => {
			parkingTicketSchema = new Schema("parkingTicket", null, false);
			
			parkingTicketSchema.defineField("ticketId", SchemaId, {required: true});
			parkingTicketSchema.defineField("arrivalTime", Date);
			parkingTicketSchema.defineField("departureTime", Date, {defaultValue: undefined});
		})
		
		it('should return correct JSON value', () => {
			expect(parkingTicketSchema.toJSON()).toEqual({
				"arrivalTime": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				},
				"departureTime": {
					"defaultValue": null,
					"required": false,
					"type": "Date"
				},
				"ticketId": {
					"defaultValue": expect.any(String),
					"required": true,
					"type": "SchemaId"
				}
			});
		});
		
		it('should return correct value', () => {
			expect(parkingTicketSchema.toValue()).toEqual(expect.objectContaining({
				"arrivalTime": expect.any(Date),
				"departureTime": expect.any(Date),
				"ticketId": expect.any(String)
			}))
		});
	});
	
	it('should handle nested schemas', () => {
		interface ToDo extends SchemaDefaultValues {
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

		expect(todoSchema.toJSON()).toEqual({
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
				"defaultValue": expect.any(String),
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
				"defaultValue": {
					"avatar": "",
					"createdDate": null,
					"id": expect.any(String),
					"lastUpdatedDate": null,
					"name": ""
				},
				"required": true,
				"type": "Schema<user>"
			}
		})
		expect(todoSchema.toValue()).toEqual({
			"createdDate": expect.any(Date),
			"description": "",
			"id": expect.any(String),
			"lastUpdatedDate": expect.any(Date),
			"name": "",
			"selected": false,
			"state": "",
			"user": {
				"avatar": "",
				"createdDate": expect.any(Date),
				"id": expect.any(String),
				"lastUpdatedDate": expect.any(Date),
				"name": "",
			}
		})
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
		expect(todoSchema.isValidFieldValue("user.name", "")).toBeFalsy();
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
		expect(todoSchema.getField("user")?.toJSON()).toEqual({
			"defaultValue": {
				"avatar": "",
				"createdDate": null,
				"id": expect.any(String),
				"lastUpdatedDate": null,
				"name": ""
			},
			"required": true,
			"type": "Schema<user>"
		});
	});
	
	it('should handle all', () => {
		const userSchema = new Schema("user", {
			name: new SchemaValue(String, true),
			avatar: new SchemaValue(String),
		});
		const itemSchema = new Schema("item", {
			name: new SchemaValue(String, true),
			description: new SchemaValue(String),
			user: new SchemaValue(userSchema, true),
			selected: new SchemaValue(Boolean),
			count: new SchemaValue(Number),
			total: new SchemaValue(OneOf(String, Number)),
			realTotal: new SchemaValue(Int32Array),
			values: new SchemaValue(ArrayOf(Number)),
			image: new SchemaValue(Blob),
			buffer: new SchemaValue(ArrayBuffer),
		});
		
		expect(itemSchema.toJSON()).toEqual({
			"buffer": {
				"defaultValue": null,
				"required": false,
				"type": "ArrayBuffer"
			},
			"count": {
				"defaultValue": 0,
				"required": false,
				"type": "Number"
			},
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
				"defaultValue": expect.any(String),
				"required": false,
				"type": "SchemaId"
			},
			"image": {
				"defaultValue": null,
				"required": false,
				"type": "Blob"
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
			"realTotal": {
				"defaultValue": expect.any(Int32Array),
				"required": false,
				"type": "Int32Array"
			},
			"selected": {
				"defaultValue": false,
				"required": false,
				"type": "Boolean"
			},
			"total": {
				"defaultValue": null,
				"required": false,
				"type": "OneOf<String, Number>"
			},
			"user": {
				"defaultValue": {
					"avatar": "",
					"createdDate": null,
					"id": expect.any(String),
					"lastUpdatedDate": null,
					"name": ""
				},
				"required": true,
				"type": "Schema<user>"
			},
			"values": {
				"defaultValue": [],
				"required": false,
				"type": "Array<Number>"
			}
		})
		expect(itemSchema.getInvalidSchemaDataFields({
			name: "my todo",
			user: {
				name: "John Doe"
			}
		})).toEqual([])
		expect(itemSchema.getInvalidSchemaDataFields({
			name: "item",
			description: "some desc",
			user: {
				name: "John Doe"
			},
			selected: true,
			count: 12,
			total: "12",
			realTotal: new Int32Array(8),
			values: [2, 4, 6],
			image: new Blob(),
			buffer: new ArrayBuffer(8),
		})).toEqual([])
		expect(itemSchema.getInvalidSchemaDataFields({
			name: "item",
			description: "some desc",
			user: {
				name: "John Doe"
			},
			selected: true,
			count: 12,
			total: 12,
			realTotal: new Int32Array(8),
			values: [2, 4, 6],
			image: new Blob(),
			buffer: new ArrayBuffer(8),
		})).toEqual([])
		expect(itemSchema.getInvalidSchemaDataFields({
			name: "item",
			description: "some desc",
			user: {
				name: "John Doe"
			},
			selected: true,
			count: "12",
			total: true,
			realTotal: new Array(8),
			values: [true],
			image: "sample",
			buffer: [],
		})).toEqual([
			"count",
			"total",
			"realTotal",
			"values",
			"image",
			"buffer"
		])
	});
});
