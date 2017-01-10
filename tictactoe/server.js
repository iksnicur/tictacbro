
var express = require('express');
var app = express();
var server = app.listen(3000);

app.use(express.static('public'));
console.log("My server is running");

var socket = require('socket.io');
var io = socket(server);

var users = [];
var connections = [];
var userTaken = [];
var compTaken = [];
var boardOpen = [];
var spaces = [];
var random = true;
var userWin = false;
var compWin = false;
var catsGame = false;


function User(id, name) {
	this.id    = id;
	this.username  = name;
}

io.sockets.on('connection', newConnection);

function newConnection(socket) {
	connections.push(socket);
	console.log("We have a new client: " + socket.id);
	console.log('Connected: %s sockets connected', connections.length);
	//console.log('new connection: ' + socket.id);
	//console.log(socket);

	// Disconnect
	socket.on('disconnect',
		function(data) {
			//if(!socket.username) return;
			var user;
			for( var i = 0 ; i < users.length; i++) {
				if(socket.id == users[i].id) {
					user = users[i];
				}
			}

			io.sockets.emit('user disconnected', user);
			//console.log(user.username + " disconnected..");
			users.splice(users.indexOf(user), 1);

			updateUsernames();
			connections.splice(connections.indexOf(socket), 1);
			console.log("Disconnected: %s sockets connected", connections.length);
		}
	);

	// New User
	//var duplicate = false;
	socket.on('new user',
		function newUser(data, callback) {
			callback(true);
			var user = new User(socket.id, data);
			console.log("New user - " + user.id + ", " + user.username);
			users.push(user);
			updateUsernames();
		}
	);

	// Random Difficulty
	socket.on('random',
		function random(data) {
			start_game();
			console.log("Player chose random difficulty.");
		}
	);

	// Hard Difficulty
	socket.on('hard',
		function hard(data) {
			start_game();
			random = false;
			console.log("Player chose hard difficulty.");
		}
	);

	// Player Moved
	socket.on('move',
		function move(data) {

			boardOpen.splice(boardOpen.indexOf(data), 1);
			userTaken.push(data);
			spaces[data] = "X";
			console.log("User takes " + data);

			userWin = checkWin("user");

			if (boardOpen.length > 0 && !userWin) {
				compTurn();
				compWin = checkWin("comp");
			}

			if(userWin) {
				console.log("User Wins!");
				io.sockets.emit('winner', "user");
			}
			if(compWin) {
				console.log("Comp Wins!");
				io.sockets.emit('winner', "comp");
			}
			if(boardOpen.length == 0){
				console.log("Cat's Game!");
				io.sockets.emit('winner', "cat");
			}

			for(var i = 0 ; i < spaces.length; i++) {
				console.log("Spaces["+i+"] = " + spaces[i]);
			}


		});

		socket.on('reset',
			function reset(data) {
				start_game();
			}
		);




}// End of Connection

function updateUsernames() {
	console.log("Total Number of users: " + users.length);
	for(i = 0 ; i < users.length; i++) {
		console.log(users[i]);
	}
	io.sockets.emit('get users', users);
}

//Start / Reset game
function start_game() {
		userTaken = [];
		compTaken = [];
		spaces = [];
		for(var i = 0; i < 9; i++) {
			boardOpen[i] = i;
			spaces[i] = null;
		}
}

function compTurn() {
	//Random Difficulty
	if(random) {
		var index = boardOpen[Math.floor(Math.random()*boardOpen.length)];
		boardOpen.splice(boardOpen.indexOf(index), 1);
		compTaken.push(index);
		spaces[index] = "O";
		console.log("Computer takes " + index);
		io.sockets.emit('computer turn', index);
	}

	//Hard Difficulty
	if(!random) {
		var index;
		var found = false;

		//If middle spot is open, take it
		if(spaces[4] == null) {
			index = 4;
			found = true;
		}
		else {
			index = computer_can_win();
		}
		if(!checkVal(index)) {
			index = computer_can_block();
		}
		if(!checkVal(index)) {
			index = computer_neither();
  	}
		//If no win or no block available

		boardOpen.splice(boardOpen.indexOf(index), 1);
		compTaken.push(index);
		spaces[index] = "O";

		console.log("Computer takes " + index);
		io.sockets.emit('computer turn', index);
	}
}

/*------------------------------------------------------------------------------
Function: 	computer_can_win

Use:				Check if the computer can win;
						return winning index

Arguments:	none

Returns:		index of best move or null
//----------------------------------------------------------------------------*/
function computer_can_win() {
	var index;
	//----------------------------------------------------------------------------
	//Check for win in top row
	//----------------------------------------------------------------------------
	if(spaces[0] == "O" && spaces[1] == "O" && spaces[2] == null) {
		index = 2;
	}	else if(spaces[0] == "O" && spaces[2] == "O" && spaces[1] == null) {
		index = 1;
	} else if(spaces[1] == "O" && spaces[2] == "O" && spaces[0] == null) {
		index = 0;
	}
	//Left col win
	else if(spaces[0] == "O" && spaces[3] == "O" && spaces[6] == null) {
		index = 6;
	} else if(spaces[0] == "O" && spaces[6] == "O" && spaces[3] == null) {
		index = 3;
	} else if(spaces[3] == "O" && spaces[6] == "O" && spaces[0] == null) {
		index = 0;
	}
	//Left to right diag win
	else if(spaces[0] == "O" && spaces[4] == "O" && spaces[8] == null) {
		index = 8;
	} else if(spaces[0] == "O" && spaces[8] == "O" && spaces[4] == null) {
		index = 4;
	} else if(spaces[4] == "O" && spaces[8] == "O" && spaces[0] == null) {
		index = 0;
	}
	//Middle col win
	else if(spaces[1] == "O" && spaces[4] == "O" && spaces[7] == null) {
		index = 7;
	} else if(spaces[1] == "O" && spaces[7] == "O" && spaces[4] == null) {
		index = 4;
	} else if(spaces[4] == "O" && spaces[7] == "O" && spaces[1] == null) {
		index = 1;
	}
	//----------------------------------------------------------------------------
	//Check for right column win
	//----------------------------------------------------------------------------
	else if(spaces[2] == "O" && spaces[5] == "O" && spaces[8] == null) {
		index = 8;
	}	else if(spaces[2] == "O" && spaces[8] == "O" && spaces[5] == null) {
		index = 5;
	} else if(spaces[5] == "O" && spaces[8] == "O" && spaces[2] == null) {
		index = 2;
	}
	//Right to left diag win
	else if(spaces[2] == "O" && spaces[4] == "O" && spaces[6] == null) {
		index = 6;
	} else if(spaces[2] == "O" && spaces[6] == "O" && spaces[4] == null) {
		index = 4;
	} else if(spaces[4] == "O" && spaces[6] == "O" && spaces[2] == null) {
		index = 2;
	}
	//----------------------------------------------------------------------------
	//Check for middle row win
	//----------------------------------------------------------------------------
	else if(spaces[3] == "O" && spaces[4] == "O" && spaces[5] == null) {
		index = 5;
	} else if(spaces[3] == "O" && spaces[5] == "O" && spaces[4] == null) {
		index = 4;
	} else if(spaces[4] == "O" && spaces[5] == "O" && spaces[3] == null) {
		index = 3;
	}
	//----------------------------------------------------------------------------
	//Check for bottom row
	//----------------------------------------------------------------------------
	else if(spaces[6] == "O" && spaces[7] == "O" && spaces[8] == null) {
		index = 8;
	} else if(spaces[6] == "O" && spaces[8] == "O" && spaces[7] == null) {
		index = 7;
	} else if(spaces[7] == "O" && spaces[8] == "O" && spaces[6] == null) {
		index = 6;
	}

	return index;
}

/*------------------------------------------------------------------------------
Function: 	computer_can_block

Use:				If computer can't win;
						check if the computer can block the user from winning,
						return the block index

Arguments:	none

Returns:		index of best move or null
//----------------------------------------------------------------------------*/
function computer_can_block() {
	var index;
	//----------------------------------------------------------------------------
	//Check for block
	//----------------------------------------------------------------------------
	//Top Row
	if(spaces[0] == "X" && spaces[1] == "X" && spaces[2] == null) {
		index = 2;
	}	else if(spaces[0] == "X" && spaces[2] == "X" && spaces[1] == null) {
		index = 1;
	} else if(spaces[1] == "X" && spaces[2] == "X" && spaces[0] == null) {
		index = 0;
	}
	//Left Col
	else if(spaces[0] == "X" && spaces[3] == "X" && spaces[6] == null) {
		index = 6;
	} else if(spaces[0] == "X" && spaces[6] == "X" && spaces[3] == null) {
		index = 3;
	} else if(spaces[3] == "X" && spaces[6] == "X" && spaces[0] == null) {
		index = 0;
	}
	//Left to Right Diagonal
	else if(spaces[0] == "X" && spaces[4] == "X" && spaces[8] == null) {
		index = 8;
	} else if(spaces[0] == "X" && spaces[8] == "X" && spaces[4] == null) {
		index = 4;
	} else if(spaces[4] == "X" && spaces[8] == "X" && spaces[0] == null) {
		index = 0;
	}
	//----------------------------------------------------------------------------
	//Check for block in middle column
	//----------------------------------------------------------------------------
	else if(spaces[1] == "X" && spaces[4] == "X" && spaces[7] == null) {
		index = 7;
	} else if(spaces[1] == "X" && spaces[7] == "X" && spaces[4] == null) {
		index = 4;
	} else if(spaces[4] == "X" && spaces[7] == "X" && spaces[1] == null) {
		index = 1;
	}
	//----------------------------------------------------------------------------
	//Check for right col block
	//----------------------------------------------------------------------------
	else if(spaces[2] == "X" && spaces[5] == "X" && spaces[8] == null) {
		index = 8;
	}	else if(spaces[2] == "X" && spaces[8] == "X" && spaces[5] == null) {
		index = 5;
	} else if(spaces[5] == "X" && spaces[8] == "X" && spaces[2] == null) {
		index = 2;
	}
	//Right to left diag block
	else if(spaces[2] == "X" && spaces[4] == "X" && spaces[6] == null) {
		index = 6;
	} else if(spaces[2] == "X" && spaces[6] == "X" && spaces[4] == null) {
		index = 4;
	} else if(spaces[4] == "X" && spaces[6] == "X" && spaces[2] == null) {
		index = 2;
	}
	//----------------------------------------------------------------------------
	//Check for block in middle row
	//----------------------------------------------------------------------------
	else if(spaces[3] == "X" && spaces[4] == "X" && spaces[5] == null) {
		index = 5;
	} else if(spaces[3] == "X" && spaces[5] == "X" && spaces[4] == null) {
		index = 4;
	} else if(spaces[4] == "X" && spaces[5] == "X" && spaces[3] == null) {
		index = 3;
	}
	//----------------------------------------------------------------------------
	//Check for block in bottom row
	//----------------------------------------------------------------------------
	else if(spaces[6] == "X" && spaces[7] == "X" && spaces[8] == null) {
		index = 8;
	} else if(spaces[6] == "X" && spaces[8] == "X" && spaces[7] == null) {
		index = 7;
	} else if(spaces[7] == "X" && spaces[8] == "X" && spaces[6] == null) {
		index = 6;
	}

	return index;

}

/*------------------------------------------------------------------------------
Function: 	computer_neither

Use:				If computer can't win or block the user,
						find and return the best spot

Arguments:	none

Returns:		index of best move
//----------------------------------------------------------------------------*/
function computer_neither() {
	var index;

	//If user is in the middle and computer hasn't taken a spot yet
	if(spaces[4] == "X" && compTaken[0] == null) {
		if(spaces[0] == null) {
			index = 0;
		} else if(spaces[2] == null) {
			index = 2;
		} else if(spaces[6] == null) {
			index = 6;
		} else if(spaces[8] == null) {
			index = 8;
		}
	}
	else if(spaces[0] == "X" && spaces[4] == "O" && spaces[8] == "X"
					&& (spaces[1] == null || spaces[3] == null || spaces[5] == null || spaces[7] == null)) {
			if(spaces[1] == null) {
				index = 1;
			}
			else if(spaces[3] == null) {
				index = 3;
			} else if(spaces[5] == null) {
				index = 5;
			} else if(spaces[7] == null) {
				index = 7;
			}
	}
	else if(spaces[2] == "X" && spaces[4] == "O" && spaces[6] == "X"
					&& (spaces[1] == null || spaces[3] == null || spaces[5] == null || spaces[7] == null)) {
			if(spaces[1] == null) {
				index = 1;
			}
			else if(spaces[3] == null) {
				index = 3;
			} else if(spaces[5] == null) {
				index = 5;
			} else if(spaces[7] == null) {
				index = 7;
			}
	}
	else if(spaces[4] == "X" && spaces[0] == "X" && spaces[8] == "O"
					&& spaces[2] == null || spaces[6] == null) {
			if(spaces[2] == null) {
				index = 2;
			} else if(spaces[6] == null) {
				index = 6;
			}
	}
	else if(spaces[4] == "X" && spaces[8] == "X" && spaces[0] == "O"
					&& spaces[2] == null || spaces[6] == null) {
			if(spaces[2] == null) {
				index = 2;
			} else if(spaces[6] == null) {
				index = 6;
			}
	}
	else if(spaces[4] == "X" && spaces[2] == "X" && spaces[6] == "O"
					&& spaces[0] == null || spaces[8] == null) {
			if(spaces[0] == null) {
				index = 0;
			} else if(spaces[8] == null) {
				index = 8;
			}
	}
	else if(spaces[4] == "X" && spaces[6] == "X" && spaces[2] == "O"
					&& spaces[0] == null || spaces[8] == null) {
			if(spaces[0] == null) {
				index = 0;
			} else if(spaces[8] == null) {
				index = 8;
			}
	}

	else {
		index = boardOpen[Math.floor(Math.random()*boardOpen.length)];
	}

	return index;
}

function checkVal(i) {
	if(i == 0 || i == 1 || i == 2 || i == 3 || i == 4 || i == 5 || i == 6 || i == 7 || i == 8) {
		return true;
	}
	else {
		return false;
	}
}

function checkWin(player) {
		if(player == "user") {
			//Check columns
			for(var i = 0; i < 3; i++) {
				if(spaces[i] == "X" && spaces[i+3] == "X" && spaces [i+6] == "X") {
					userWin = true;
					return true;
				}
			}
			//Check rows
			for(var i = 0; i <= 6; i += 3) {
				if(spaces[i] == "X" && spaces[i+1] == "X" && spaces[i+2] == "X") {
					userWin = true;
					return true;
				}
			}
			//Check left to right diag
			if(spaces[0] == "X" && spaces[4] == "X" && spaces[8] == "X") {
				userWin = true;
				return true;
			}
			//Check right to left diag
			if(spaces[2] == "X" && spaces[4] == "X" && spaces[6] == "X") {
				userWin = true;
				return true;
			}

			//False if none of the above is found
			return false;
		}
		if(player == "comp") {
			//Check columns
			for(var i = 0; i < 3; i++) {
				if(spaces[i] == "O" && spaces[i+3] == "O" && spaces [i+6] == "O") {
					compWin = true;
					return true;
				}
			}
			//Check rows
			for(var i = 0; i <= 6; i += 3) {
				if(spaces[i] == "O" && spaces[i+1] == "O" && spaces[i+2] == "O") {
					compWin = true;
					return true;
				}
			}
			//Check left to right diag
			if(spaces[0] == "O" && spaces[4] == "O" && spaces[8] == "O") {
				compWin = true;
				return true;
			}
			//Check right to left diag
			if(spaces[2] == "O" && spaces[4] == "O" && spaces[6] == "O") {
				compWin = true;
				return true;
			}
			//No win if none of the above is found

			return false;
		}


}
