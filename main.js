(function() {

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  var LaserBase = function(){
    this.db = this.constructor
    this.collections = {}
  }

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = LaserBase;
    }
    exports.LaserBase = LaserBase;
  } else {
    root.LaserBase = LaserBase;
  }

  LaserBase.prototype.create_collection = function( collection_name ){
    this.collections[ collection_name ] = new LaserBase.Collection({
      collection_name: collection_name,
      db_instance: this
    });
    // create shorthand access
    this[ collection_name ] = this.collections[ collection_name ]
  }

  LaserBase.Collection = function( opt ){
    this.db_instance = opt.db_instance // back-reference
    this.collection_name = opt.collection_name
    this.data = []
    this.live_queries = []
    this.Resource = function( data ){
      // copy data as own attributes
      _.merge( this, data )
    }
    this.Resource.prototype = LaserBase.Resource
  }

  LaserBase.Resource = {
    delete: function() {},
    update: function() {},
    save: function() {}
  }

  LaserBase.Collection.prototype.insert = function( record ) {
    var collection = this;
    if ( _.isArray( record ) ) {
      _.forEach( record, function( record ){
        collection.data.push( new collection.Resource( record ) )
      })
    } else {
      collection.data.push( new collection.Resource( record ) )
    }

    collection.update_live_queries();
  }

  LaserBase.Collection.prototype.update_live_queries = function() {
    var collection = this
    _.forEach( collection.live_queries, function( query ) {
      query.result.length = 0 // in-place empty the array
      _.merge(
        query.result,
        _.where( collection.data, query.search_term )
      );
    })
  }

  LaserBase.Collection.prototype.where = function( search_term ) {
    var result = _.where( this.data, search_term )

    // save reference to result object
    this.live_queries.push({
      search_term: search_term,
      result: result
    })
    return result;
  }

  // Get resource with matching ID
  LaserBase.Collection.prototype.find = function( id ) {
    return _.find( this.data, { id: id } )
  }

  LaserBase.Collection.prototype.has_many = function( relation_name, opt ) {
    var related_collection = this.db_instance.collections[ relation_name ]

    // allows to call relationship methods directly on Resource instance
    this.Resource.prototype[relation_name] = function() {
      var search_query = {}
      search_query[ opt.fkey ] = this.id
      return related_collection.where( search_query )
    }
  }

}.call(this));