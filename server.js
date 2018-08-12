// run with node-foreman
// nf run npm start

const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )
var db=mongoose.connection
mongoose.Promise=global.Promise
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// set up schema and model
var Schema = mongoose.Schema

var ExModelSchema = new Schema({
  userId: {type:String,required:true},
  description:{type:String,required:true},
  duration:{type:Number,required:true},
  date:Date
})

var UserModelSchema = new Schema({
  username: {type:String, required:true}
})

var ExModel = mongoose.model('ExModel',ExModelSchema)
var UserModel=mongoose.model('UserModel',UserModelSchema)

function handleError(err) {
  console.log(err)
}

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// three routes
// new user
app.route('/api/exercise/new-user')
  .post(function(req,res){
  var user = req.body.username
// check if exists
UserModel.find({'username':user},function(err,users)
  {
  if (users.length>0) {
    res.send('username already taken')
  }   
  else 
  {
    var user_instance = new UserModel({username:user})
    user_instance.save(function(err) {
      if(err) return handleError(err)
    })
    
    res.send(user_instance)
    
  }
  })  
})
  
app.route('/api/exercise/add')
  .post(function(req,res){
    var userId=req.body.userId
    var duration = req.body.duration
    var date = req.body.date
    var description = req.body.description
    var ex_instance= new ExModel({userId:userId,duration:duration,date:date,description:description})
    ex_instance.save(function(err) {
      if(err) {
        res.send('error saving')
        return handleError(err)}
       else{
        res.send(ex_instance)

      }
    })
    
    
})

app.route('/api/exercise/log')
  .get(function(req,res){
  var userId=req.query.userId
  var from =req.query.from
  var to = req.query.to
  var limit=parseInt( req.query.limit)
  /*
  GET users's exercise log: GET /api/exercise/log?{userId}[&from][&to][&limit]
  { } = required, [ ] = optional
  from, to = dates (yyyy-mm-dd); limit = number
  */
  
  var conditions={'userId':userId}
  // check parameters and use in query
  if (from!=null) {
    conditions['date']={$gt:from}
  }
  if (to!=null){
    conditions['date']={$lt:to}
  }
  if (limit===null) {
    limit=0
  } 

  var results = ExModel.find(conditions,function(err,records)
  {
  if (records===undefined) {
    res.send('no records')
  }   
  else if (records.length===0) {
    res.send('no records')
  } else
  {
    res.send(records)
  }}
 ).limit(limit)  
})



// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
