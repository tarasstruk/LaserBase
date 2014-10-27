var assert = require("assert")
var should = require("should")
var _ = require("lodash")



var LaserBase = function(){
  var self = this.constructor

  var create_table = function( table_name ){
    this.tables[ table_name ] = new self.Table({
      name: table_name,
      db: this
    });
    // create shorthand access
    this[ table_name ] = this.tables[ table_name ]
  }

  return {
    tables: {},
    create_table: create_table
  }
}

LaserBase.Table = function( opt ){
  this.db = opt.db // back-reference
  this.name = opt.name
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
  var related_table = this.db.tables[ relation_name ]

  // allows to call relationship methods directly on Resource instance
  this.Resource.prototype[relation_name] = function() {
    var search_query = {}
    search_query[ opt.fkey ] = this.id
    return related_table.where( search_query )
  }
}





describe('LaserBase', function(){

  var DB = new LaserBase()

  describe('tables', function(){
    it('should be an empty object', function(){
      DB.tables.should.be.instanceOf(Object)
      DB.tables.should.be.empty
    })
  })

  describe('create_table', function(){
    it('should create a new collection', function(){
      DB.create_table('users')
      DB.users.should.be.instanceOf(Object)
      DB.users.live_queries.should.be.empty
    })
  })

  describe('insert', function(){
    var mock_person = { id: 666, name: 'Bob' }

    var mock_people = [
      { id: 667, name: 'Foo' },
      { id: 668, name: 'Bar' }
    ]

    it('should insert plain object', function(){
      DB.users.insert( mock_person )
      DB.users.find(666).should.eql( mock_person )
    })

    it('should insert array of objects', function(){
      DB.users.insert( mock_people )
      DB.users.find(667).should.eql( mock_people[0] )
      DB.users.find(668).should.eql( mock_people[1] )
    })

    it('should have 3 users at that point', function(){
      DB.users.data.length.should.eql( 3 )
    })
  })

  describe('resource', function(){
    
    describe('save', function(){
      it('should be an function', function(){
        var res = DB.users.data[0]
        res.save.should.be.instanceof( Function )
      })
    })

  })

  describe('where', function(){
    
    it('should be a function', function(){
      DB.users.where.should.be.instanceOf(Function)
    })

    it('should search', function(){
      DB.users.where({ name: 'Bob' })[0].id.should.eql( 666 )
    })

    it('should return objects wrapped in Resource class', function(){
      DB.users.where({ name: 'Bob' })[0].should.be.instanceof( DB.users.Resource )
    })

    it('should create a life search object', function(){
      var result = DB.users.where({ name: 'Bob' })

      result.length.should.eql(1)
      result[0].should.be.instanceof( DB.users.Resource )

      // add another Bob; this could happen async
      DB.users.insert({ id: 777, name: 'Bob' })

      // result count should change
      result.length.should.eql(2)
      // resources still wrapped
      result[0].should.be.instanceof( DB.users.Resource )
      result[1].should.be.instanceof( DB.users.Resource )
    })

  })

  describe('has_many', function(){

    it('shouldnt throw any errors when table is declared', function(){
      DB.create_table('todos')
      DB.users.has_many('todos', { fkey: 'user_id' })
    })

    it('should access related objects', function(){
      var mock_todo_data = [
        { id: 1, todo: 'FooBar', user_id: 666 },
        { id: 2, todo: 'FooBar2', user_id: 667 }
      ]
      DB.todos.insert( mock_todo_data )
      var results = DB.users.find(667).todos()

      results.length.should.eql(1)
      results[0].should.eql( mock_todo_data[1] )
    })

    it('should be a live query', function(){
      var results = DB.users.find(667).todos()
      results.length.should.eql(1)
      DB.todos.insert({ id: 3, todo: 'FooBar3', user_id: 667 })
      results.length.should.eql(2)
    })

  })

})