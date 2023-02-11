# Schema
A schema is an object type representation of the data you will be reading and putting in your store.

## Arguments

```ts
new Schema(name, map)
```

### name
Name of the schema.

#### Type: `string`
#### Required: TRUE

### map
An object literal with property field which values are `SchemaValue` instance.

#### Type: `SchemaValueMap | null`
#### Required: FALSE
#### Default Value: `null`

## Properties
| Name                 | Description                                                                                         | Type     |
|----------------------|-----------------------------------------------------------------------------------------------------|----------|
| `name`               | The name you gave to the schema when initializing it. Will match the store if accessed in the store | `string` |

## Methods
| Name                         | Description                                                           | Async   | Arguments                                                                                                               | Return        |
|------------------------------|-----------------------------------------------------------------------|---------|-------------------------------------------------------------------------------------------------------------------------|---------------|
| `defineField`                | Define a field                                                        | no      | `name: string, type: SchemaValueConstructorType &#124; Schema<T>, options: { defaultValue?: any, required?: boolean }`  | `void`        |
| `removeField`                | Remove a field definition                                             | no      | `name: string`                                                                                                          | `void`        |
| `hasField`                   | Check if a field definition exists                                    | no      | `name: string`                                                                                                          | `boolean`     |
| `getField`                   | Get a single field definition                                         | no      | `name: string`                                                                                                          | `SchemaValue` |
| `isValidFieldValue`          | Check if a value is valid for a specific field                        | no      | `name: string, value: any`                                                                                              | `boolean`     |
| `getInvalidSchemaDataFields` | Get a list of all invalid field given a object literal                | no      | `value: Record<string, any>, defaultKeys: Set<string>`                                                                  | `string[]`    |
| `toJSON`                     | Get a `JSON` representation os the schema                             | no      | `None`                                                                                                                  | `SchemaJSON`  |
| `toString`                   | Get a `string` representation os the schema                           | no      | `None`                                                                                                                  | `string`      |
| `toValue`                    | Get an `Object` representation os the schema with default values      | no      | `None`                                                                                                                  | `T`           |


## Errors

### Field "*" is not a SchemaValue
Error thrown when the key value is not a `SchemaValue` instance

```ts
// Symbol is not a SchemaValue instance
new Schema('sample', {
  val: Symbol('invalid')
})
```

## Examples

```ts
const userSchema = new Schema("user", {
  name: new SchemaValue(String, true),
  avatar: new SchemaValue(String),
});

const todoSchema = new Schema("todo", {
  name: new SchemaValue(String, true),
  id: new SchemaValue(SchemaId),
  dateCreated: new SchemaValue(Date),
  dateUpdated: new SchemaValue(Date),
  description: new SchemaValue(String, false, "No Description"),
  complete: new SchemaValue(Boolean),
  user: new SchemaValue(userSchema, true),
});
```

```ts
const userSchema = new Schema<User>("user");
const todoSchema = new Schema<ToDo>("todo");

userSchema.defineField("name", String, {required: true});

todoSchema.defineField("name", String, {required: true});
todoSchema.defineField("description", String);
todoSchema.defineField("complete", Boolean);
todoSchema.defineField("user", userSchema, {required: true});
```
