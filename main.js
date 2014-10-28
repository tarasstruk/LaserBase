(function() {

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  var LaserBase = function(){
    this.db = this.constructor
    this.tables = {}
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

  LaserBase.prototype.create_table = function( table_name ){
    this.tables[ table_name ] = new LaserBase.Table({
      table_name: table_name,
      db_instance: this
    });
    // create shorthand access
    this[ table_name ] = this.tables[ table_name ]
  }

  LaserBase.Table = function( opt ){
    this.db_instance = opt.db_instance // back-reference
    this.table_name = opt.table_name
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

  LaserBase.Table.prototype.insert = function( record ) {
    var table = this;
    if ( _.isArray( record ) ) {
      _.forEach( record, function( record ){
        table.data.push( new table.Resource( record ) )
      })
    } else {
      table.data.push( new table.Resource( record ) )
    }

    table.update_live_queries();
  }

  LaserBase.Table.prototype.update_live_queries = function() {
    var table = this
    _.forEach( table.live_queries, function( query ) {
      query.result.length = 0 // in-place empty the array
      _.merge(
        query.result,
        _.where( table.data, query.search_term )
      );
    })
  }

  LaserBase.Table.prototype.where = function( search_term ) {
    var result = _.where( this.data, search_term )

    // save reference to result object
    this.live_queries.push({
      search_term: search_term,
      result: result
    })
    return result;
  }

  // Get resource with matching ID
  LaserBase.Table.prototype.find = function( id ) {
    return _.find( this.data, { id: id } )
  }

  LaserBase.Table.prototype.has_many = function( relation_name, opt ) {
    var related_table = this.db_instance.tables[ relation_name ]

    // allows to call relationship methods directly on Resource instance
    this.Resource.prototype[relation_name] = function() {
      var search_query = {}
      search_query[ opt.fkey ] = this.id
      return related_table.where( search_query )
    }
  }

}.call(this));