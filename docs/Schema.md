# Schema
A schema is an object type representation of the data you will be reading and putting in your store.

The following is true for Schemas:
- all schemas must have a name;
- all schema come with optional keys: `id`, `createdDate`, `lastUpdatedDate`
- all fields in the schema must be a valid `SchemaValue` type;
- all schema can validate data against itself;
- all schema will generate the data representing the schema with defaults;

## Create a Schema
To create a schema you need 3 options where only the first one is required:
- **name (required)**: the name for the schema;
- **object**: the body of the schema;
- **includeDefaultKeys**: a flag that indicates whether to include default keys: id, createdDate, and updatedDate;

```js
const userSchema = new Schema("user");
const todoSchema = new Schema("todo");
```

### Schema type

If using `Typescript`, you have the option to further tell how the data looks like.

```ts
interface User extends SchemaDefaultValues {
	name: string;
}

interface ToDo extends SchemaDefaultValues {
	name: string;
	description: string;
	complete: boolean;
}

const userSchema = new Schema<User>("user");
const todoSchema = new Schema<ToDo>("todo");
```

## Define the Schema
By default, no schema is empty. All schemas have come with a `id`, `createdDate` and `updatedDate` fields. You can exclude
these for when you want to create a value from the schema, but they are always there.

You can then further define the fields of your schema and there are two ways to do so:

##### Via constructor:

```ts
const todoSchema = new Schema<ToDo>("todo", {
	name: new SchemaValue(String, true), // make name required
	description: new SchemaValue(String),
	complete: new SchemaValue(Boolean),
});
```

##### Via `defineField` property:

```ts
const todoSchema = new Schema<ToDo>("todo");

todoSchema.defineField("name", String, {required: true});
todoSchema.defineField("description", String);
todoSchema.defineField("complete", Boolean);
```

Both accomplish the same thing, and it is up to you which one you want to use.

## Generate Schema Value
The `Schema` object comes with the `toValue` method which will return an object literal representation of your schema
with default values.

```js
todoSchema.toValue()
/*
{
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "",
  description: "",
  complete: false,
  createdDate: "January, 4th 2022",
  lastUpdatedDate: "January, 4th 2022",
}
 */
```

Here the `id`, `createdDate` and `lastUpdatedDate` will be different every time you call the `toValue` method.

The Schema have the following default depending on the types:
- Number => 0;
- String => "";
- Boolean => false;
- Array & TypedArray => empty array of same type;
- ArrayBuffer => empty array buffer;
- Date => date at call time;
- Schema => resulting of calling `toValue` on the type;
- SchemaId => UUID;
- All else => null;

Of-course you may also define your default values when defining each field.

```js
todoSchema.defineField("description", String, {defaultValue: "No description"});

// or

new SchemaValue(String, false, "No description");
```

## Nesting Schemas
A schema lets you define a single object, but the power of a schema resides in its ability to validate itself deeply and nesting.

Below is an example of how we could nest the `user` schema inside the `todo` schema.

```js
interface User extends SchemaDefaultValues {
    name: string;
}

interface ToDo extends SchemaDefaultValues {
    name: string;
    description: string;
    complete: boolean;
    user: User;
}

const userSchema = new Schema<User>("user");
const todoSchema = new Schema<ToDo>("todo");

userSchema.defineField("name", String, {required: true});

todoSchema.defineField("name", String, {required: true});
todoSchema.defineField("description", String);
todoSchema.defineField("complete", Boolean);
todoSchema.defineField("user", userSchema, {required: true});

```
The value of this `todo` schema when calling `toValue` would be, for example:
```js
/*
{
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "",
  description: "",
  complete: false,
  user: {
    id: 3483748929e82382,
    name: "",
    createdDate: "January, 4th 2022",
    lastUpdatedDate: "January, 4th 2022",
  }
  createdDate: "January, 4th 2022",
  lastUpdatedDate: "January, 4th 2022",
}
 */
```

### Deep access
You can use dot notation string to access things deeply inside nested schemas.

```js
// only works with these
todoSchema.getField("user.name");
todoSchema.hasField("user.name");
todoSchema.removeField("user.name");
todoSchema.isValidFieldValue("user.name", "");
```

## Validating Value
The schema handles two types of validation:
- type: whether the value has the correct type, and it is a supported type;
- required: whether it must have a value or not;

You can check a single property with `isValidFieldValue`:
```js
userSchema.isValidFieldValue("name", 12) // false
userSchema.isValidFieldValue("name", "Mary") // true
userSchema.isValidFieldValue("name", "") // true
userSchema.isValidFieldValue("name", null) // false
userSchema.isValidFieldValue("name", undefined) // false
```

You may also get all the invalid fields by passing an object to be validated against the schema
```js
todoSchema.getInvalidSchemaDataFields({}); // ["name", "user.name"]
todoSchema.getInvalidSchemaDataFields({
  name: "workout"
}); // ["user.name"]
todoSchema.getInvalidSchemaDataFields({
  name: "workout",
  user: {}
}); // ["user.name"]
todoSchema.getInvalidSchemaDataFields({
  name: "workout",
  user: {
    name: "John Doe"
  }
}); // [] -> means with this minimal data object I can create a new Todo item
```

## API definition
| Fields                     | Description                                                                                                              | Property       |
|----------------------------|--------------------------------------------------------------------------------------------------------------------------|----------------|
| name                       | The name of the Schema                                                                                                   | yes - readonly |
| includeDefaultKeys         | Whether the default keys are included                                                                                    | yes - readonly |
| defaultKeys                | Returns the default keys: id, createdDate, lastUpdatedDate                                                               | yes - readonly |
| defineField                | Defines a single field by taking the: name, isRequired, {required, defaultValue};                                        | no             |
| removeField                | Removes a single field by name                                                                                           | no             |
| hasField                   | Returns whether the field exists by taking the name                                                                      | no             |
| getField                   | Returns the `SchemaValue` by taking the name                                                                             | no             |
| isValidFieldValue          | Returns whether the value is valid for a specific field. Takes the name of the field and the value you want to test for. | no             |
| getInvalidSchemaDataFields | Returns a list of invalid fields and takes an object which partially or entirely represents the Schema                   | no             |
| toJSON                     | Returns a JSON representation of the `Schema`                                                                            | no             |
| toValue                    | Returns a object representing the `Schema` with their default and generated values                                       | no             |
| toString                   | Returns a JSON string representation of the  `Schema`                                                                    | no             |

