# Client Web Storage
Browser storage interface for IndexedDB, WebSQL, LocalStorage, and in memory data with Schema and data validator.

## Installation

### In Node Projects:

```bash
npm install client-web-storage
```

```js
import {Schema, ClientStore} from "client-web-storage";
```

### In the Browser

```html
<!-- use the latest version -->
<script src="https://unpkg.com/client-web-storage/dist/client-web-storage.min.js"></script>

<!-- use a specific version -->
<script src="https://unpkg.com/client-web-storage@1.0.0/dist/client-web-storage.min.js"></script>
```

```js
const {Schema, ClientStore} = window;
```

## Documentation
The library is very small but super powerful. There are only few things to interact with:
- **Schema** : what determines how the data looks like;
- **SchemaValue** : creates a single value in the schema;
- **ClientStore** : what manages the data (CRUD);

### Schema

To create a schema you need 3 options where only the first one is required:
- **name (required)**: the name for the schema;
- **object**: the body of the schema;
- **includeDefaultKeys**: a flag that indicates whether to include default keys: id, createdDate, and updatedDate;

#### Initialize Schema

```js
const todoShema = new Schema("todo");
```

If using `Typescript`, you have the option to further tell how the data looks like.

```ts
interface ToDo extends Schema.DefaultValue {
	name: string;
	description: string;
	complete: boolean;
}

const todoShema = new Schema<ToDo>("todo");
```

This will further ensure you can't set any data not defined by the type provided. It makes it super easier to work with.

#### Define Schema
You can define the schema in two ways:

##### Via constructor:

```ts
import {Schema, SchemaValue} from "client-web-storage";

// must extend Schema.DefaultValue to include the default values
interface ToDo extends Schema.DefaultValue {
	name: string;
	description: string;
	complete: boolean;
}

const todoShema = new Schema<ToDo>("todo", {
	name: new SchemaValue(String, true), // make name required
	description: new SchemaValue(String),
	complete: new SchemaValue(Boolean),
});
```

You will use `SchemaValue` to define each item. The `SchemaValue` takes 3 options where only the first on is required:
- **type (required)**: the type of the value. These are Javascript types;
- **isRequired**: whether is required;
- **defaultValue**: the value to use when one is not provided. `SchemaValue` have default values depending on the type;

###### SchemaValue valid types
- `Schema` => you can nest `Schema`
- `SchemaId` => used to create the id
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

##### Via `defineField` property:

```ts
import {Schema, SchemaValue} from "client-web-storage";

// must extend Schema.DefaultValue to include the default values
interface ToDo extends Schema.DefaultValue {
	name: string;
	descriptios: string;
	complete: boolean;
}

const todoShema = new Schema<ToDo>("todo");

todoShema.defineField("name", String, {required: true});
todoShema.defineField("description", String);
todoShema.defineField("complete", Boolean);
```

##### API definition

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


### ClientStore

Once you have your schema defined, you can then define your store. The `ClientStore` constructor takes few options
- **name ( required )**: the name for the store;
- **schema ( required )**: the schema for the store;
- **config**: the configuration for the store which you can use to further customize your store;
- **whenReady**: the callback function you want to store to call once it has loaded in the browser.

```ts
import {ClientStore} from "client-web-storage";

const todoStore = new ClientStore<ToDo>("todos", todoSchema)
```

#### Store configurations
You may want to further configure your store, especially if you want to take advantage of versioning.

These are the configuration options:
- **appName**: Your application name. Used to name `IndexedDB` and `WebSQL` store types;
- **version**: Your store version. Used to version `IndexedDB`, and `WebSQL` store types;
- **type**: Your store type. Can be one of these values: `LOCALSTORAGE`, `WEBSQL`, `INDEXEDDB`, or `MEMORY_STORAGE` which you can read from `ClientStore.Type`;
- **description**: Some way to describe your store. Used to describe `IndexedDB`, and `WebSQL` store types;

#### CRUD the Store

```js
todoStore.createItem({
  name: "Go shopping" // only name is required
});
/* 
Creates item in the store
{
  id: 3284732894792342, // generated id
  name: "Go shopping",
  description: "",
  complete: false,
  createdDate: "January, 4th 2022",
  lastUpdatedDate: "January, 4th 2022",
}
*/
```

If you want to not include the default keys, you can turn it off when creating the schema with the third argument set to `False`.

```js
const todoShema = new Schema<ToDo>("todo", null, false);

todoShema.defineField("name", String, {required: true});
todoShema.defineField("description", String);
todoShema.defineField("complete", Boolean);

todoStore.createItem({
  name: "Go to Gym" // only name is required
});
/* 
Creates item in the store
{
  name: "Go shopping",
  description: "",
  complete: false,
}
*/
```

As you can see, the store takes care of the rest and validates the data you provided. For example, the followings will fail:
```js
todoStore.createItem() // did not provide required "name" field value
todoStore.createItem({
  name: 12
}); // name is not of type String
```

##### API definition

| Field      | Description                                                                                                           | Property       |
|------------|-----------------------------------------------------------------------------------------------------------------------|----------------|
| name       | The name of the store                                                                                                 | yes - readonly |
| ready      | Whether the store has loaded                                                                                          | yes - readonly |
| type       | The type of the store: `LOCALSTORAGE`, `WEBSQL`, `INDEXEDDB`, or `MEMORY_STORAGE`                                     | yes - readonly |
| size       | How big is the store in bytes                                                                                         | yes - readonly |
| createItem | Creates an item given a partial or entire representation of the schema with values                                    | no - async     |
| updateItem | Updates an item given a partial or entire representation of the schema with values                                    | no - async     |
| getItems   | Returns a list of items                                                                                               | no - async     |
| getItem    | Return an item given the item id                                                                                      | no - async     |
| removeItem | Remove an item given the item id                                                                                      | no - async     |
| clear      | Removes all items from the store                                                                                      | no - async     |
| findItem   | Finds a specific item given a filter callback which is called with the item and must returns a `Boolean`              | no - async     |
| findItems  | Finds all items which matched the given a filter callback which is called with the item and must returns a  `Boolean` | no - async     |
| subscribe  | Takes a callback to call when things change in the store. The callback is called with the event and the item id       | no             |
