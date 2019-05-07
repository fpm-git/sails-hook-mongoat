/**
 * @file index.js
 * Created by Mike (https://github.com/Salakar) on 26-05-2015.
 * Cured of cancer by Yuki (https://github.com/Rua-Yuki) on 04-04-2018. It was really fvcked.
 */

const SailsHookMongoat = (sails) => ({

  initialize(done) {
    sails.after('hook:orm:loaded', () => {
      this.createAllIndexes().then(res => done()).catch(done);
    });
  },

  /**
   * Handles creating all indices, simply by iterating over all models and calling the
   * createModelIndexes method for each.
   */
  async createAllIndexes() {
    // Determine whether or not we should create indexes (and get a fitting reason if not).
    const createPrefs = this.shouldCreateIndexes();
    if (!createPrefs.shouldCreate) {
      sails.log.warn('[Mongoat]', 'Not creating indexes:', createPrefs.forbiddenReason);
      return;
    }

    sails.log.debug('[Mongoat]', 'Handling model index updates...');
    // load indices for each model. we wait for each "synchronously," but Mongo doesn't parallelise it anyway (by default)... (and we wouldn't want to break guarantees by doing that either)
    for (modelName in sails.models) {
      await this.createModelIndexes(sails.models[modelName]);
    }
    sails.log.debug('[Mongoat]', 'Done updating indexes!');
  },

  /**
   * Handles creating the indices for a single model.
   *
   * @param model - A sails model definition, as obtained from sails.models.
   */
  async createModelIndexes(model) {
    // leave early if this model has no custom indexes specified
    if (!Array.isArray(model.indexes) || (model.indexes.length === 0)) {
      return;
    }

    // grab our model connections/datastores, so we can make sure this model is on Mongo (if not, leave with a warning)
    const connections = model.adapter ? model.adapter.connections : model._adapter.datastores;  // v1 AND v0.12 SUPPORT ?!?!?!
    if (connections[Object.keys(connections)[0]].config.adapter !== 'sails-mongo') {
      sails.log.warn(`Mongoat: skipping index creation for model "${model.tableName}" as it is not using the "sails-mongo" adapter.`);
      return;
    }

    // create a Mongo index for each model-defined index item
    const collection = (typeof model.getDatastore === 'function') ? model.getDatastore().manager.collection(model.tableName) : await asyncify(model.native);
    model.indexes.forEach(async index => {
      try {
        await collection.ensureIndex(index.attributes, index.options || {});
        sails.log.verbose(`Mongoat: created index for model "${model.tableName}" !`);
      } catch (e) {
        sails.log.error(`Mongoat: failed to create index for model "${model.tableName}":`, e);
      }
    });
  },

  /**
   * @typedef {object} ShouldCreateIndexInfo
   * @property {boolean} shouldCreate - Whether or not index updates should be performed.
   * @property {string} [forbiddenReason] - Reason for which indexes should not be updated.
   * Must be set when `canCreate` is `false`.
   */
  /**
   * Determines whether or not we are allowed to create or update new indexes, returning
   * an object with fitting error details in the event where something would prevent our
   * attempted changes.
   *
   * By default, index updates are forbidden when not running in `alter` or `drop` mode,
   * though this may be overridden by specifying a truthy `mongoat.forceUpdate` value in
   * the config.
   *
   * One convenient way to ensure indexes are updated is to simply pass the force-update
   * flag when lifting:
   * `sails console --mongoat.forceUpdate`
   *
   * @returns {ShouldCreateIndexInfo}
   */
  shouldCreateIndexes() {
    // If we've mongoat configured to force updates, return immediately indicating we're
    // allowed.
    if (sails.config.mongoat && sails.config.mongoat.forceUpdate) {
      return { shouldCreate: true };
    }
    // If we're not in `alter` or `drop` mode, avoid updates.
    if (sails.config.models && !['alter', 'drop'].includes(sails.config.models.migrate)) {
      return {
        shouldCreate: false,
        forbiddenReason: `Model migration strategy "${sails.config.models.migrate}" was set. Use "alter" or "drop" to enable index creation, or build them manually.`,
      };
    }
    // Otherwise we're good to go ahead and create/update indexes!
    return { shouldCreate: true };
  },

});

/**
 * Helper function used to call a callback-accepting function, returning the result as a
 * promise instead, for easy usage with async/await.
 *
 * @param {Function} func - The function which should be executed. Expected to accept a
 * callback of the form (err, ...results).
 * @param {...any} params - A list of parameters to pass through to `func`.
 *
 * @returns {Promise<any|any[]>} a promise which resolves to either a single value, or an
 * array representing multiple values returned, based on the callback response.
 */
function asyncify(func, ...params) {
  return new Promise((resolve, reject) => {
    func(...params, (err, ...res) => {
      if (err) {
        return reject(err);
      }
      return resolve(res.length <= 1 ? res[0] : res);
    });
  });
}

module.exports = SailsHookMongoat;
