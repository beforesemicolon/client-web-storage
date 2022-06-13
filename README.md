# Client Web Storage
Browser storage interface for IndexedDB, WebSQL, LocalStorage, and in memory data with basic Schema and data validation.

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

## Get Started
The library is very small but super powerful. There are only few things to interact with:
- **[Schema](https://github.com/beforesemicolon/client-web-storage/blob/main/docs/Schema.md)** : Determines how the data looks like;
- **[SchemaValue](https://github.com/beforesemicolon/client-web-storage/blob/main/docs/SchemaValue.md)** : Creates a single value in the schema;
- **[ClientStore](https://github.com/beforesemicolon/client-web-storage/blob/main/docs/ClientStore.md)** : Manages the data (CRUD);

```ts
// Define schema TS type
import {ClientStore, Schema} from "client-web-storage";

interface ToDo extends Schema.DefaultValue {
    name: string;
    description: string;
    complete: boolean;
}

// create and define schema
const todoShema = new Schema<ToDo>("todo");

todoShema.defineField("name", String, {required: true});
todoShema.defineField("description", String);
todoShema.defineField("complete", Boolean);

// create and use the store
const todoStore = new ClientStore("todos", todoShema);

todoStore.createItem({
    name: "Go to Gym" // only name is required
});

/*  Creates item in the store
{
  id: 3284732894792342, // generated id
  name: "Go to Gym",
  description: "",
  complete: false,
  createdDate: "January, 4th 2022",
  lastUpdatedDate: "January, 4th 2022",
}
*/
```
