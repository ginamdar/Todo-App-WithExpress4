var http =  require('http');
var express = require('express');
var session = require('express-session');
var csrf = require('csrf');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var routes = require('./routes');
var tasks = require('./routes/tasks');
var lessmiddleware = require('less-middleware');
var mongoskin = require('mongoskin');
var methodOverride = require('method-override');
var db = mongoskin.db('mongodb://localhost:27017/todo?auto_reconnect', {safe:true});
var app = express();
app.use(function(req, res, next) {
  req.db = {};
  req.db.tasks = db.collection('tasks');
  next();
})
app.locals.appname = 'Express.js Todo App'
// all environments


app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({secret: '59B93087-78BC-4EB9-993A-A61FC844F6C9'}));
app.use(csrf());

app.use(lessmiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, resp, next){
	resp.locals._csrf = req.session._csrf;
	return next();
});

//app.use('/users', users);
// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}
app.param('task_id', function(req, res, next, taskId) {
  console.log("Middleware task_id called " + taskId);
  req.db.tasks.findById(taskId, function(error, task){
    if (error) return next(error);
    if (!task) return next(new Error('Task is not found.'));
    req.task = task;
    return next();
  });
});

app.get('/', routes.index);
app.get('/tasks', tasks.list);
app.post('/tasks', tasks.markAllCompleted);
app.post('/tasks', tasks.add);
app.get('/tasks/completed', tasks.completed);
app.post('/tasks/:task_id', tasks.markCompleted);
app.del('/tasks/:task_id', tasks.del);


app.all('*', function(req, res){
  res.send(404);
})
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
