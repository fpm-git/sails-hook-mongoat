# sails-hook-mongoat
[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Dependency Status][daviddm-image]][daviddm-url]

Provides advanced mongo indexing options for sails.js models that use the sails-mongo adapter.

## Usage

```bash
npm install git+ssh://git@github.com/fpm-git/sails-hook-mongoat.git
```

Then simply add an 'indexes' array property to your sails model(s) that you want to add custom indexers on.  This contains all your indexes.

Index properties:

 - **attributes** - an object with the attributes to index (can also be text indexes)
 - **options** (optional) - index options (see [Mongo Index Options](http://docs.mongodb.org/manual/reference/method/db.collection.createIndex/#options-for-all-index-types))

## Examples ##

### Creating a TTL index:
```js
// MY MODEL WITH A DATE FIELD
module.exports = {
  attributes: {
    myDate: {
      type: 'date',
      required: true,
    },
  },
  indexes: [{
    attributes: {
      myDate: 1,
    },
    options: {
      expireAfterSeconds: 60,  // expire 60s after myDate
    },
  }],
};
```


### Creating a composite unique index:
```js
// MY EVENTS MODEL
module.exports = {
  attributes: {
    event_id: {
      type: 'integer',
      required: true,
    },
    match_id: {
      type: 'integer',
      required: true,
    },
  },
  indexes: [{
    // Index on both `event_id` and `match`.
    attributes: {
      event_id: -1,    // desc
      match: 1,        // asc
    },
    options: {
      unique: true,
    },
  }],
};
```

### Forcing updates to run in `safe` migration mode:

Sometimes it might be desireable to run migrations in safe mode, something which is automatically prevented by default. In such scenarios, switching to `drop` or `alter` may not entirely be an option.

For these cases, the `mongoat.forceUpdate` config value may be set to a truthy value, forcing the hook to attempt updates regardless of model migration preference.

This flag may be set conveniently through the commandline when launching your Sails app:

```bash
# With Sails running in console mode:
$ sails console --mongoat.forceUpdate

# Or run Sails without the REPL:
$ sails lift --mongoat.forceUpdate

# Or run Sails directly:
$ node ./node_modules/.bin/sails lift --mongoat.forceUpdate
```



[npm-image]: https://img.shields.io/npm/v/sails-hook-mongoat.svg?style=flat-square
[npm-url]: https://npmjs.org/package/sails-hook-mongoat
[travis-image]: https://img.shields.io/travis/teamfa/sails-hook-mongoat.svg?style=flat-square
[travis-url]: https://travis-ci.org/teamfa/sails-hook-mongoat
[daviddm-image]: http://img.shields.io/david/teamfa/sails-hook-mongoat.svg?style=flat-square
[daviddm-url]: https://david-dm.org/teamfa/sails-hook-mongoat
