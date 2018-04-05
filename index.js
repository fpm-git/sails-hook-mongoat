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
    sails.log.debug('Mongoat: creating model indexes...');

    // leave without applying indices, if we're not using an 'alter' or 'drop' strategy
    if (sails.config.models && (['alter', 'drop'].indexOf(sails.config.models.migrate) < 0)) {
      sails.log.warn(`Mongoat: not creating indexes due to model migration strategy "${sails.config.models.migrate}". Use "alter" or "drop" to enable index creation, or build them manually.`);
      return;
    }

    // load indices for each model. we wait for each "synchronously," but Mongo doesn't parallelise it anyway (by default)... (and we wouldn't want to break guarantees by doing that either)
    for (modelName in sails.models) {
      await this.createModelIndexes(sails.models[modelName]);
    }
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
