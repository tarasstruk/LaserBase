var assert = require("assert")
var should = require("should")
var _ = root._ = require("lodash")
var LaserBase = require('../main.js')

describe('LaserBase', function(){

  var DB = new LaserBase()

  describe('collections', function(){
    it('should be an empty object', function(){
      DB.collections.should.be.instanceOf(Object)
      DB.collections.should.be.empty
    })
  })

  describe('create_collection', function(){
    it('should create a new collection', function(){
      should.not.exist( DB.users )
      DB.create_collection('users')
      DB.users.should.be.instanceOf(Object)
      DB.users.live_queries.should.be.empty
    })

    it('should return pointer to the newly created collection', function(){
      var result = DB.create_collection('omg')
      result.should.equal( DB.omg )
    })

    it('should accept adapter as second argument', function(){
      var MyAdapter = {}
      DB.create_collection('things', MyAdapter).should.be.ok
      DB.things.adapter.should.equal( MyAdapter )
    })

    // TODO: use proper stubs, not some boolean var magic!
    it('should use save method coming from adapter', function(){
      var mock_obj = { id:1, prop:'Foo' }
      var MyAdapter = { save: function(){ this.is_saved = true } }
      var coll = DB.create_collection('thingsss', MyAdapter)
      coll.insert(mock_obj)
      var obj = coll.find(1)
      obj.should.eql(mock_obj)
      assert.strictEqual(obj.is_saved, undefined)
      obj.save()
      obj.is_saved.should.be.true
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

    it('shouldnt throw any errors when collection is declared', function(){
      DB.create_collection('todos')
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