// __Module Definition__
var middleware = module.exports = {
  // Set the conditions used for finding/removing documents
  conditions: function (request, response, next) {
    if (!request.query.conditions) return next();

    var conditions = request.query.conditions;
    if (typeof request.query.conditions === 'string') conditions = JSON.parse(conditions);

    request.baucis.conditions = conditions;
    next();
  },
  // Specify that a count, rather than documents, should be returned
  count: function (request, response, next) {
    if (!request.query.count) return next();

    request.baucis.count = true;
    next();
  },
  // Apply various options based on controller parameters
  controller: function (request, response, next) {
    if (request.baucis.controller.get('select') && request.baucis.query) {
      request.baucis.query.select(request.baucis.controller.get('select'));
    }
    next();
  },
  deprecated: function (request, response, next) {
    // Controller Options
    if (request.baucis.controller.get('restrict')) return next(new Error('The "restrict" controller options is deprecated.  Use query middleware instead.'));
    // Headers
    if (request.headers['x-baucis-push']) return next(new Error('The "X-Baucis-Push header" is deprecated.  Use "X-Baucis-Update-Operator: $push" instead.'));
    // No deprecated features found.
    next();
  },
  // Apply various options based on request query parameters
  query: function (request, response, next) {
    var populate;
    var error = null;
    var query = request.baucis.query;

    if (request.query.sort) query.sort(request.query.sort);
    if (request.query.skip) query.skip(request.query.skip);
    if (request.query.limit) query.limit(request.query.limit);
    if (request.query.select && request.baucis.query) {
      if (request.query.select.indexOf('+') !== -1) {
        return next(new Error('Including excluded fields is not permitted.'));
      }
      if (request.baucis.controller.checkBadSelection(request.query.select)) {
        return next(new Error('Including excluded fields is not permitted.'));
      }
      query.select(request.query.select);
    }
    if (request.query.populate) {
      populate = request.query.populate;

      if (typeof populate === 'string') {
        if (populate.indexOf('{') !== -1) populate = JSON.parse(populate);
        else if (populate.indexOf('[') !== -1) populate = JSON.parse(populate);
      }

      if (!Array.isArray(populate)) populate = [ populate ];

      populate.forEach(function (field) {
        if (error) return;
        if (request.baucis.controller.checkBadSelection(field.path || field)) {
          return error = new Error('Including excluded fields is not permitted.');
        }
        // Don't allow selecting fields from client when populating
        if (field.select) {
          return error = new Error('May not set selected fields of populated document.');
        }

        query.populate(field);
      });
    }

    next(error);
  },
  checkId: function (request, response, next) {
    var findBy = request.baucis.controller.get('findBy');
    var id = request.params.id;
    var findByPath = request.baucis.controller.get('model').schema.path(findBy);
    var check = ['ObjectID', 'Number'];
    var instance = findByPath.instance;

    if (!id) return next();
    if (check.indexOf(instance) === -1) return next();
    if (instance === 'ObjectID' && id.match(/^[a-f0-9]{24}$/i)) return next();
    if (instance === 'Number' && !isNaN(Number(id))) return next();

    response.send(400, 'Invalid ID.');
  },
  checkMethod: function (request, response, next) {
    var method = request.method.toLowerCase();
    if (request.baucis.controller.get(method) !== false) return next();
    response.send(405, 'The requested method has been disabled for this resource.');
  }
};
