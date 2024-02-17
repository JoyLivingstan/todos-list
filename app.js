const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializedDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializedDbAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  const {search_q = '', priority, status} = request.query
  let getTodoQuery = ''

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
      SELECT * FROM todo WHERE
        todo LIKE '%${search_q}%'
        AND  priority = '${priority}'
        AND status = '${status}';`
      break
    case hasPriorityProperty(request.query):
      getTodoQuery = `
      SELECT * FROM todo WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodoQuery = `
        SELECT * FROM todo WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}';`
      break
    default:
      getTodoQuery = `
        SELECT * FROM WHERE
        todo LIKE '%${search_q}%';`
  }

  const array1 = await db.all(getTodoQuery)
  response.send(array1)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const gettodoItemQuery = `
    SELECT * FROM todo
    WHERE id = ${todoId};`
  const array2 = await db.get(gettodoItemQuery)
  response.send(array2)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const posttodoItemQuery = `
    INSERT INTO todo(id, todo, priority, status)
    VALUES (${id}, '${todo}', '${priority}', '${status}');`
  const array3 = await db.run(posttodoItemQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }
  const previousTodoQuery = `
    SELECT * FROM todo
    WHERE id = ${todoId};`
  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body
  const updateTodoQuery = `
    UPDATE todo
    SET todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
    WHERE id = '${todoId}';`
  await db.run(updateTodoQuery)
  response.send(`${updateColumn} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
