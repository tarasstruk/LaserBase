# My playground. Structure and description coming soon.


## Simple Database setup
```javascript
var DB = new LaserBase()

DB.create_table('users')
DB.create_table('todos')

DB.users.has_many('todos', { fkey: 'user_id' })
```

## Add one record
```javascript
DB.users.insert({ id:1, name: 'Bob' })
```

##  Add multiple records
```javascript
DB.users.insert([
  { id:2, name: 'Paul' },
  { id:3, name: 'Mike' }
])
```

## Find one record by its ID
```javascript
DB.users.find(2)
```

## Find by any property
```javascript
var result = DB.users.where({ name: 'Paul' })
console.log( results )
  => [{ id:2, name: 'Paul' }]
```

## Live update of results after collection changes
```javascript
DB.users.insert({ id:4, name: 'Paul' })
console.log( results )
  => [{ id:2, name: 'Paul' }, { id:4, name: 'Paul' }]
```