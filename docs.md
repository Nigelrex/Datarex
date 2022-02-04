# Full Documentation

## Methods

- [Add](#add)
- [All](#all)
- [Backup](#backup)
- [clearCache](#clearcache)
- [Close](#close)
- [Delete](#delete)
- [deleteAll](#deleteall)
- [Divide](#divide)
- [Get](#get)
- [Has](#has)
- [Multiply](#multiply)
- [Push](#push)
- [removeArrVal](#removearrval)
- [removeObjVal](#removeobjval)
- [Set](#set)
- [setExpiry](#setexpiry)
- [setMany](#setmany)
- [Subtract](#subtract)

### Pre-configs for easy usage

+++ databaseSchema.js

```js
const Datarex = require("datarex");
const db = new Datarex({
    path: "./Databases/my DB/index.sqlite",  //defalts to "./Databases/index.sqlite"
    tableName: "New Table",  // Optional
    Intervals: {
        expiryInterval: 40000, // defaults to 1000
        clearCacheInterval: 200000 // defaults to 300000
    },
    settings: {
        inMemory: true, //defaults to true
        clearCache: false, //defaults to true
        loadKeys: true   //defaults to true
    },
});

// Note path, tableName, and Intervals and settings are all optional, Defaults are already set
module.exports.db = db;
```

`path` is the absolute path to the sqlite file.
`tableName` Name of the table you want to access.
`Intervals` is an object with two properties, `expiryInterval` and `clearCacheInterval`.
`expiryInterval` is the interval in milliseconds to check for expiry.
`clearCacheInterval` is the interval in milliseconds to clear the cache.
`settings` is an object with two properties, `inMemory`, `clearCache` and `loadKeys`.
`inMemory` is a boolean that determines if the database must be cached.
`clearCache` is a boolean that determines if the cache is cleared at intervals.
`loadKeys` is a boolean that determines if the keys are loaded at the start of the process.

+++ index.js

```js
const { db } = require("./databaseSchema");
// Rest of the stuff
```

+++

### Functions

```js
db.db // this directly allows you to interact with the database with better-sqlite3 SQL 
```

!!!
For all methods that modify the value, the value must be set to the specified key
!!!

### Add

!!!
You need to set the value of the key as a number before adding it.
!!!

```js
// Import db from databaseSchema.js
db.set("key", 46);
db.add("key", 20); // adds 46 + 20 and stores it as 66
```

### All

It returns all the stored data in the table as a array.

```js
const data = db.all();
console.log(data); // [{key: "key", value: 66}]
data.forEach(element => {
    console.log(element); // logs {KEY: "key", VALUE: 66}
});
```

### Backup

Backup your database incase of a corruption.

```js
db.backup({ name: "MY DATABASE", path: "./backup-index.sqlite" });
```

### clearCache

Clears the cache of the database.

```js
db.clearCache();
```

### Close

!!!danger
This will close the database, and will be inaccessable untill the process restarts.
!!!

```js
db.close();
```

### Delete

Deletes a key from the database.

```js
db.delete("key"); //removes key from database
```

### deleteAll

!!!danger
This will wipe out your database.
!!!

```js
db.deleteAll();
```

### Divide

```js
db.get("key"); // returns 66
db.divide("key", 2); // divides key by 2 and stores it as 33
```

### Get

```js
db.get("key"); // returns 33
```

Returns `undefined` if the key does not exist.

### Has

```js
db.has("key"); // returns true
db.has("key2"); // returns false
```

### Multiply

```js
db.get("key"); // returns 33
db.multiply("key", 2); // multiplies key by 2 and stores it as 66
```

### Push

!!!
The key must contain a array as a value.
!!!

```js
db.push("key", "value"); // adds value to key
```

### removeArrVal

```js
db.get("key"); // returns [1, 2, 3]
db.removeArrVal("key", (value) => value === 1); // removes 1 from key
```

### removeObjVal

```js
db.get("key"); // returns {a: 1, b: 2, c: 3}
db.removeObjVal("key.a"); // removes "a" from key and stores it as {b: 2, c: 3}
```

### Set

```js
db.set("key", 33); // sets key to 33
```

### setExpiry

```js
db.setExpiry("key", "5m"); // sets key to expire in 5 minutes [1s 2m 3h 4d 5mo 6y]
```

### setMany

```js
db.setMany([
    {KEY: 33, VALUE: "value"},
    {KEY: "key", VALUE: "value"}
]);
```

### Subtract

```js
db.get("key"); // returns 33
db.subtract("key", 20); // subtracts 20 from key and stores it as 13
```
