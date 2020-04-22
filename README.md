# sails-hook-mongoat
[![License][license-image]][license-url]
[![Current release][release-image]][release-url]
[![Build status][ci-image]][ci-url]
[![Dependency status][daviddm-image]][daviddm-url]
[![Development dependency status][daviddm-dev-image]][daviddm-dev-url]

Provides advanced MongoDB indexing options for [Sails.js](https://github.com/balderdashy/sails) models that use the [sails-mongo](https://github.com/balderdashy/sails-mongo) adapter.

## Usage

```bash
npm i git+ssh://git@github.com/fpm-git/sails-hook-mongoat.git
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



[release-image]: https://badgen.net/github/release/fpm-git/sails-hook-mongoat
[release-url]: https://github.com/fpm-git/sails-hook-mongoat/releases/latest
[license-image]: https://badgen.net/github/license/fpm-git/sails-hook-mongoat
[license-url]: https://github.com/fpm-git/sails-hook-mongoat/blob/master/LICENSE
[ci-image]: https://badgen.net/github/status/fpm-git/sails-hook-mongoat/master/ci
[ci-url]: https://circleci.com/gh/fpm-git/sails-hook-mongoat
[daviddm-image]: https://badgen.net/david/dep/fpm-git/sails-hook-mongoat
[daviddm-url]: https://david-dm.org/fpm-git/sails-hook-mongoat
[daviddm-dev-image]: https://badgen.net/david/dev/fpm-git/sails-hook-mongoat
[daviddm-dev-url]: https://david-dm.org/fpm-git/sails-hook-mongoat?type=dev
