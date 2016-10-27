var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require("path");

app.use(express.static(__dirname + "/../client/"));

var users = [];

app.get('/insta-chat', function(req, res){
  res.sendFile(path.join(__dirname + "/../client/templates/index.html"));
});

app.get('/users', function(req, res){
  res.send(users);
});

io.on("connection", function(socket) {
	//io.emit("user joined", socket.id);

	socket.on("new user", function(name) {
		var user = {
			name: name,
			socketId: socket.id
		}
		users.push(user);
		io.emit("new user", user);
	})

	//console.log("a user connected");
	socket.on("disconnect", function() {
		var user = {};
		for(var i=0; i<users.length; i++) {
			if(users[i].socketId === socket.id) {
				user = users[i];
				users.splice(i, 1);
				break;
			}
		}
		io.emit("user left", user);
	});

	socket.on("chat message", function(msg) {
		io.emit("chat message", msg);
	});

});

var port = 3000;
http.listen(port, function(){
  console.log('listening on *:' + port);
});