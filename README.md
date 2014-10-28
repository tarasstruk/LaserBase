# My playground. Structure and description coming soon.


## Simple Database setup
```javascript
var DB = new LaserBase()
DB.create_table('users')

// Add one record
DB.users.insert({ id:1, name: 'Bob' })

// Add multiple records
DB.users.insert([
  { id:2, name: 'Paul' },
  { id:3, name: 'Mike' }
])

// Find one record by its ID
var one_record = DB.users.find(2)

// Find by any property
var result = DB.users.where({ name: 'Paul' })
console.log( results )
// => [{ id:2, name: 'Paul' }]

// Live update of results after collection changes
DB.users.insert({ id:4, name: 'Paul' })
console.log( results )
// => [{ id:2, name: 'Paul' }, { id:4, name: 'Paul' }]

```


## Associations
```javascript
var DB = new LaserBase()
DB.create_table('users')
DB.create_table('todos')
DB.users.has_many('todos', { fkey: 'user_id' })

DB.users.insert([
  { id:1, name: 'Paul' },
  { id:2, name: 'Mike' }
])

DB.todos.insert([
  { id: 1, todo: 'Foo', user_id: 1 },
  { id: 2, todo: 'Bar', user_id: 2 }
])

var results = DB.users.find(1).todos()
console.log( results )
// => [{ id: 1, todo: 'Foo', user_id: 1 }]

// Records fetched by associations will also auto-magically update
DB.todos.insert({ id: 3, todo: 'FooBar', user_id: 1 })
console.log( results )
// => [{ id: 1, todo: 'Foo', user_id: 1 }, { id: 3, todo: 'FooBar', user_id: 1 }]
```