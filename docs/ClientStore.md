# ClientStore
A client store is a single document defined by its schema. It can be of different types which means, you can choose to
store different data in a different way and use the same API to interact with the data regardless of the type.

Here are the supported types:
- `LOCALSTORAGE` => [Learn More](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- `WEBSQL` => [Learn More](https://www.w3.org/TR/webdatabase/)
- `INDEXEDDB` => [Learn More](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- `MEMORY_STORAGE` => In memory data storage. Goes away when the page browser tab is closed.

The advantage of this is you can have different documents and decide whether it makes sense to store it in memory
or permanently in the browser.

## Create a Store
All stores must have a schema.
Once you have your schema defined, you can then define your store. The `ClientStore` constructor takes few options
- **name ( required )**: the name for the store;
- **schema ( required )**: the schema for the store;
- **config**: the configuration for the store which you can use to further customize your store;

```ts
const todoStore = new ClientStore<ToDo>("todos", todoSchema)
```

## Configure the Store
You may want to further configure your store, especially if you want to take advantage of versioning.

These are the configuration options:
- **appName**: Your application name. Used to name `IndexedDB` and `WebSQL` store types;
- **version**: Your store version. Used to version `IndexedDB`, and `WebSQL` store types;
- **type**: Your store type. Can be one of these values: `LOCALSTORAGE`, `WEBSQL`, `INDEXEDDB`, or `MEMORY_STORAGE` which you can read from `ClientStore.Type`;
- **description**: Some way to describe your store. Used to describe `IndexedDB`, and `WebSQL` store types;

```ts
const todoStore = new ClientStore<ToDo>("todos", todoSchema, {
    appName: "My Todo App",
    version: "1.0", // change when configuration or schema for the store has changed
    type: ClientStore.Type.LOCALSTORAGE,
    description: "manages user todos"
})
```

## Subscribing to the Store
You may also subscribe to the store for following events:
- **ready**: when store has been initialized;
- **created**: when item has been added to the store;
- **deleted**: when item has been deleted from the store;
- **updated**: when item has been updated to the store;
- **cleared**: when store has been cleared;

The `subscribe` method will call the provided callback with the `event` and single or list of `id` of the todos affected by the action
when the event is other than `ready`.

```ts
const todoStore = new ClientStore<ToDo>("todos", todoSchema);

const unsub = todoStore.subscribe((event: ClientStore.EventType, todoId) => {
  // handle even here
})

unsub() // call to unsubscribe from the store

```

## CRUD Store
The store does a lot of the heavy lifting and handles pretty much everything for you while providing a simple `CRUD`
interface to interact and manage everything in the store.

For the following `CRUD` examples we will take in consideration the following:
```ts
// Schema TS type
interface User extends Schema.DefaultValue {
    name: string;
}

interface ToDo extends Schema.DefaultValue {
    name: string;
    description: string;
    complete: boolean;
    user: User;
}

// denife schemas
const userSchema = new Schema<User>("user");
const todoSchema = new Schema<ToDo>("todo");

userSchema.defineField("name", String, {required: true});

todoShema.defineField("name", String, {required: true});
todoShema.defineField("description", String);
todoShema.defineField("complete", Boolean);
todoShema.defineField("user", userSchema, {required: true});

// create stores
const userStore = new ClientStore<User>("users", userSchema);
const todoStore = new ClientStore<ToDo>("todos", todoSchema);
```

### Create an Item
To create a new item you must call the `createItem` method with all or partial data you need.

```ts
// you can create a new on or get it from the store
const AdminUser = await userStore.createItem({
    name: "John Doe"
});

const todo1 = await todoStore.createItem({
    name: "Go Shopping", // name is required
    user: AdminUser // user is required
});

/*
Will create item
{
  id: 3284732894792342,
  name: "Go shopping",
  description: "",
  complete: false,
  user: {
    id: 3483748929e82382,
    name: "John Doe",
    createdDate: "January, 4th 2022",
    lastUpdatedDate: "January, 4th 2022",
  } 
  createdDate: "January, 4th 2022",
  lastUpdatedDate: "January, 4th 2022",
}
 */
```

### Update an Item
Updating and item is very similar to creating. You can partially update the object with new values. The only thing
you can't change are the default keys `id`, `createdDate`, and `lastUpdatedDate`.

```ts
await todoStore.updateItem(todo1.id, {
  description: "Buy milk, ham and bread"
});
```

The store will automatically change the `lastUpdatedDate` date for you.

### Load items
You may also add items to the store in bulk with the `loadItems` method which will automatically determine
if the items in the given list must be updated or added to the store.

```ts
const user = await userStore.createItem({
    name: "John Doe"
});

await todoStore.loadItems([
    {name: "Go Shopping", user},
    {name: "Go To Gym", user}
]);
```

### Read Items
To read items you can either do it for a single item or all of them.

```ts
await todoStore.getItems();
await todoStore.getItem(todo1.id);
```

### Finding Items
To find items you can either do it for a single item or all of them. You must provide a callback which is called with
each item and this callback must return true or false whether it matches a pattern for you.

```ts
await todoStore.findItems((item) => item.name.match('shop'));
await todoStore.findItem((item) => item.name.match('shop'));
```

### Remove Items
To remove an item, all you need is the item id. You may also clear the entire store.

```ts
await todoStore.removeItem(todo1.id);
await todoStore.clear();
```

## API definition
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

