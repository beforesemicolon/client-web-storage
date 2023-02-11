# SchemaValue
A schema value is the individual property of the schema.

## Arguments

```ts
new SchemaValue(type, required, defaultValue)
```

### type
A supported value [Javascript type]()

#### Type: `SchemaValueConstructorType | Schema<T>`
#### Required: TRUE

### required
Whether the value is required

#### Type: `boolean`
#### Required: FALSE
#### Default Value: `false`

### defaultValue

#### Type: `SchemaValueType | SchemaJSON`
#### Required: FALSE
#### Default Value: `undefined`

## Errors

### Invalid SchemaValue type provided
Error thrown when the type specified is not a [supported type]().

```ts
// function is not a valid type
new SchemaValue(Function)
```

### Default value does not match type
Error thrown when the default value does not match the type.

```ts
// type is String but defaultValue is number
new SchemaValue(String, false, 12)
```

## Examples

```ts
new SchemaValue(Schema, false, {})
```

````ts
new SchemaValue(SchemaId, true)
````

```ts
new SchemaValue(ArrayOf(OneOf(String, Number)), false, [0, 1, 2])
```

```ts
new SchemaValue(Array, true)
```

```ts
new SchemaValue(Int32Array)
```

```ts
new SchemaValue(Date)
```

```ts
const todoSchema = new Schema<ToDo>("todo");

new SchemaValue(todoSchema, true)
```
