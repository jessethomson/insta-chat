var app = angular.module("myApp", []);

app.controller("chatCtrl", ["$scope", "$http", "socket", function($scope, $http, socket) {

	$scope.converstions = {};
	$scope.users = [];
	$scope.unreads = {};

	// load user
	$http.get("/users").then(function(response) {
		var users = response.data;
		for(var i=0; i<users.length; i++) {
			$scope.users.push(users[i]);
			$scope.converstions[users[i].socketId] = [];
		}
	}, function(err) {
		console.log(err);
	});

	$scope.registerUser = function(username) {
		$scope.myName = username;
		socket.emit("new user", $scope.myName);
	}

	$scope.onSend = function() {
		if($scope.message) {	
			socket.emit("chat message", {
				from: $scope.me.socketId,
				msg: $scope.message,
				to: $scope.selectedFriend.socketId
			});
			$scope.message = "";
			// setTimeout(function() {
			// 	var objDiv = document.getElementById("chat-box");
			// 	objDiv.scrollTop = objDiv.scrollHeight;
			// }, 250);
		}
	}

	$scope.selectFriend = function(friend) {
		$scope.selectedFriend = friend;
		if(!$scope.converstions[friend.socketId]) {
			$scope.converstions[friend.socketId] = [];
		}
		$scope.currentConversation = $scope.converstions[friend.socketId];
		$scope.unreads[friend.socketId] = undefined;
		var objDiv = document.getElementById("chat-box");
		objDiv.scrollTop = objDiv.scrollHeight;
	}

	socket.on("chat message", function(data) {
		// if it's from me
		if(data.from === $scope.me.socketId) {
			$scope.converstions[data.to].push(data);
			setTimeout(function() {
				var objDiv = document.getElementById("chat-box");
				objDiv.scrollTop = objDiv.scrollHeight;
			}, 250);
		}
		// if it's to me
		else if(data.to === $scope.me.socketId) {
			$scope.converstions[data.from].push(data);
			if($scope.converstions[data.from] != $scope.currentConversation) {
				if(!$scope.unreads[data.from]) {
					$scope.unreads[data.from] = 0;
				}
				$scope.unreads[data.from] += 1;
			}
			setTimeout(function() {
				var objDiv = document.getElementById("chat-box");
				objDiv.scrollTop = objDiv.scrollHeight;
			}, 250);
		}
	});

	socket.on("new user", function(user) {
		if(user.name != $scope.myName) {
			$scope.users.push(user);
			$scope.converstions[user.socketId] = [];
		}
		else {
			$scope.me = {
				name: $scope.myName,
				socketId: user.socketId
			}
		}
	});

	socket.on("user left", function(user) {
		if($scope.converstions[user.socketId]) {
			$scope.converstions[user.socketId] = [];
		}
		var index = $scope.users.indexOf(user);
		$scope.users.splice(index, 1);
	});

}]);

app.factory('socket', ['$rootScope', function ($rootScope) {
  var socket = io.connect();

  return {
    on: function (eventName, callback) {
      function wrapper() {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      }

      socket.on(eventName, wrapper);

      return function () {
        socket.removeListener(eventName, wrapper);
      };
    },

    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if(callback) {
            callback.apply(socket, args);
          }
        });
      });
    }
  };
}]);

