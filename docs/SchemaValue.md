# SchemaValue
A schema value is the individual properties that represent the schema.

The following is true about schema values:
- They must have a type;
- They can be required or not;
- They can have a default value;

## Define a Value
You define a value by initializing a `SchemaValue` with the options you want:
- **type (required)**: the type of the value. These are Javascript types;
- **isRequired**: whether is required;
- **defaultValue**: the value to use when one is not provided. `SchemaValue` have default values depending on the type;

```js
const name = new SchemaValue(String, true);
const currentYear = new SchemaValue(Number, false, 2022);
const userId = new SchemaValue(SchemaId, true);
const avatar = new SchemaValue(Blob);
```

### Valid value types
Types are just Javascript types with additional `Schema` used to nest schemas and `SchemaId` for schema ids.
- `Schema`
- `SchemaId`
- `Date`
- `Number`
- `String`
- `Boolean`
- `Array`
- `ArrayBuffer`
- `Blob`
- `Float32Array`
- `Float64Array`
- `Int8Array`
- `Int16Array`
- `Int32Array`
- `Uint8Array`
- `Uint8ClampedArray`
- `Uint16Array`
- `Uint32Array`
