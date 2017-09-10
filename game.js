/*
so when I originally started writing this code it was beautiful, and now when I look through it all I see is a frankenstein monsterous mess. 
I'm going to try and go through and comment the critical parts of it to try and make sense of what's happening but at a certain point I was just hacking things to
get this thing finished.
*/

/*
The player class! It's probably the most important part of this whole operation. 
Honestly it started out as a small way of just controlling where the player was and stuff, but now it grossly houses most of the sequencing for the game.
*/
class Player {
	constructor(radius, x, y) {
		this.radius = radius; //we're the only circle in the whole world
		this.width = Math.round(radius); //width and height defined so we can use basic functions on it
		this.height = Math.round(radius);
		this.x = x;
		this.y = y;
		this.sequence = 0; //this variable alone controls most of the way the game changes (but strangely not all...)
		this.talkedTo = 0;
		this.dx = 0;
		this.dy = 0;
		this.speed = 2;
		this.playedPreviously = false; //just so we don't make them sit through the intro again
		this.canMove = false;
		this.isReading = false; //if they're in the middle reading some text we don't want to like hit them with a shoe or something
		this.offered = false; 
		this.darkside = false;
		this.previouslyDark = false;
		this.undead = false; //so we don't die inbetween game ticks... 
		//it was strangely happening because the cars were still existing on the same frame that the player was set to an overlapping position with them (even though all objects were ded)
		//so it would only happen sometimes...
	} 

	act(){ //ah the act method it's how all the game objects get their chance to do their thing. It's called in a for each loop of the current game objects rougly every 10 ms
		this.handleInput();
		this.undead = false; //we shouldn't usually be undead, but there are some each cases between frames where it helps...

		if(titleScreen.gameStarted){ 
			this.gameSequence();
		}

		if(!isAtEdge(this) && this.canMove){ //move the player
			this.x += this.dx;
			this.y += this.dy;
		}
		ctx.beginPath(); //draw them
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
		ctx.fillStyle = "#FFF";
		ctx.fill();
		ctx.closePath();
		this.canMove = true;
	}

	/*
		Avert your eyes. I'm serious this code will harm your ability to program.
		It's like writing COBOL, you just don't come back from it.
		Seriously though this is the game sequencing loop, it's uhh not great.

		I'm going to take the time here to describe it to some degree, and not even try to try commenting the stuff below because it wouldn't be easy.
		So the player stores an int that references where they are in the series of events that the game handles, and here we switch on that int and do stuff to it.
		It's digusting and didn't really work right most of the time.

		It became a strange mix of just managing screens and actually managing state. Most screen handling though is done in a second switch about half way through this thing.
		I'm sorry.
	*/
	gameSequence(){
		switch(this.sequence){
			case -1:
			gameObjects = [];
			gameObjects.push(player);
			player.talkedTo = 0;
			player.darkside = false;
			player.offered = false;
			gameObjects.push(new NPC(new Rectangle(100, 50, width/2, 25, "grey"), ["The fridge hums to you the song of it's people.", "You hum along harmoniously."], 0, 100));
			gameObjects.push(new NPC(new Rectangle(100, 100, width/4, 200, "grey"), ["You stare at the table.", "The table stares back at you.", "You're not sure what it wants."], 0, 0));
			gameObjects.push(new NPC(new Rectangle(10, 100, 0, height / 6, "grey"), ["As you look through the window, your mind wanders.", "Will it always be like this?"], 350, 0));
			gameObjects.push(new NPC(new Rectangle(10, 100, 0, height / 6 + height / 2, "grey"), ["You realize this window is no different than any other.", "The window seems offended."], 320, 0));
			gameObjects.push(new NPC(new Rectangle(175, 100, width/2, height - 50, "grey"), ["The couch's tongue wriggles between your fingers.", "It beckons for you to stay."], 0, -25));
			gameObjects.push(new NPC(new Rectangle(100, 50, width/2, height / 2 + height / 6, "grey"), ["Static fills the T.V.", "How calming."], 0, 0));
			gameObjects.push(titleScreen); //this always has to be last because it's always going to pop itself from the array lmao
			titleScreen.gameStarted = false;
			console.log(player.playedPreviously);
			this.sequence++;
			break;
			case 0:
			if(this.talkedTo == 6 && !this.isReading || player.playedPreviously){
				var door = new NPC(new Rectangle(20, 100, width, height / 2, "red"), [], 0, 0);
				door.specialFunction = function(){
					if(isColliding(player, door.drawable)){
						player.sequence++;
					}
				}
				gameObjects.push(door);
				this.sequence++;
			}
			break;
			case 1:
			if(!this.isReading){
				var textBox = new TextBox(["The door is left open.", "I don't know who I am anymore."], 0, 0);
				textBox.boundToPlayer = true;
				gameObjects.push(textBox);
				this.sequence++;
			}
			break; //who needs case 2 anyways??
			case 3:
			gameObjects = [];
			gameObjects.push(player);
			player.x = 1135;
			player.y = 570;
			player.sequence++;
			player.screenPos = 0;
			player.needsUpdate = true;
			break; //time to spawn in the part of the world!
			case 4:
			if(player.needsUpdate){
				switch(player.screenPos){
					case 0:
					spawnCars();
					gameObjects.push(new NPC(new Rectangle(width, 100, width / 2, height - 50, "grey"), [], 0, 0));
					if(!player.darkside && !player.offered){
						gameObjects.push(new NPC(new Rectangle(75, 25, 1135, height - 105, "blue"), ["It tastes like home."], 0, 0));
					} else if(!player.darkside) {
						var ret = new NPC(new Rectangle(75, 25, 1135, height - 105, "blue"), ["It tastes like home."], 0, 0);
						ret.specialFunction = function(){
							if(isColliding(player, ret.drawable)){
								player.sequence = 27;
							}
						}
						gameObjects.push(ret);
					} else {
						var ret = new NPC(new Rectangle(75, 25, 1135, height - 105, "red"), ["The taste is off.", "Is this really home?"], 0, 0);
						ret.specialFunction = function(){
							if(isColliding(player, ret.drawable)){
								player.sequence = 40;
							}
						}
						gameObjects.push(ret);
					}
					gameObjects.push(new Boundry(0, height - 120));
					gameObjects.push(new Boundry(0, 0));
					player.needsUpdate = false;
					break;
					case 1:
					spawnCars();
					gameObjects.push(new NPC(new Rectangle(width, 100, width / 2, height - 50, "grey"), [], 0, 0));
					if(!player.darkside){
						if(!player.previouslyDark){
							var n = new NPC(new Rectangle(50, 50, 100, height / 2 + height / 4, "grey"), ["Hey there.", "Want to buy a ticket to heaven?",
								"What? You don't have any money?", "Sell some furniture or something."], 150, -50);
							n.doorDrawn = false;
							n.specialFunction = function(){
								if(n.playerNoticed && !n.doorDrawn){
									player.offered = true;
									var thedoor = new NPC(new Rectangle(75, 25, width / 2, height - 105, "red"), ["Like a portal to hell."], 0, 0);
									thedoor.specialFunction = function(){
										if(isColliding(player, thedoor.drawable)){
											player.screenPos = 2;
											player.needsUpdate = true;
										}
									}
									n.doorDrawn = true;
									setTimeout(function(){
										gameObjects.push(thedoor);
									}, 6100);
								}
							}
							gameObjects.push(n);
						} else {
							var n = new NPC(new Rectangle(50, 50, 100, height / 2 + height / 4, "red"), ["So you've got the cash?", "Well here's your ticket to heaven."], 150, -50);
							n.doorDrawn = false;
							n.specialFunction = function(){
								if(n.playerNoticed && !n.doorDrawn){
									setTimeout(function(){
										player.sequence = 127;
									}, 3100);
									n.doorDrawn = true;
								}
							}
							gameObjects.push(n);
						}
					}
					gameObjects.push(new Boundry(0, height - 120));
					var boundry = new Boundry(width, 0);
					boundry.left = false;
					gameObjects.push(boundry);
					player.needsUpdate = false;
					break;
					case 2:
					gameObjects = [];
					gameObjects.push(player);
					var ne = new NPC(new Rectangle(75, 25, width / 2, 15, "red"), ["It smells of sin."], 0, 0);
					ne.specialFunction = function(){
						if(isColliding(player, ne.drawable)){
							gameObjects = [];
							gameObjects.push(player); 
							player.y = height - 150;
							player.screenPos = 1;
							player.needsUpdate = true;
						}
					}						
					gameObjects.push(ne);
					var dealer = new NPC(new Rectangle(50, 50, width / 2, height - 100, "red"), ["So you're looking for some quick cash huh?", "Sure I'll buy your furniture from you."], 0, 0);
					dealer.specialFunction = function(){
						if(dealer.playerNoticed && !player.darkside){
							player.darkside = true;
						}
					}
					gameObjects.push(dealer);
					player.undead = true;
					player.x = width / 2;
					player.y = 100;
					player.needsUpdate = false;
					break;
				}	
			}
			break;
			case 27:
			gameObjects = [];
			gameObjects.push(new TextBox(["You decide to spend the night in with your friends.", "It feels good."], width / 2, height / 2));
			setTimeout(function(){
				gameObjects.push(player);
				player.sequence = -1;
				player.playedPreviously = true;
				player.x = width / 2;
				player.y = height / 2;
			}, 3100);
			player.sequence++;
			break;
			case 40:
			gameObjects = [];
			gameObjects.push(player);
			player.x = 1150;
			player.y = 350;
			player.talkedTo = 0;

			function fuck(item){ //another hack job! woo hoo!
				item.specialFunction = function(){
					if(player.talkedTo == 6 && !player.isReading){
						attack(item);
						player.sequence++;
					}
				}
			}

			var fridge = new NPC(new Rectangle(100, 50, width/2, 25, "red"), ["The fridge no longer hums.", "You can feel its judging gaze."], 0, 100);
			fuck(fridge);
			gameObjects.push(fridge);

			var table = new NPC(new Rectangle(100, 100, width/4, 200, "red"), ["You stare at the table.", "The table stares back at you.", "You know what it wants now.", "Freedom."], 0, 0);
			fuck(table);
			gameObjects.push(table);

			var window1 = new NPC(new Rectangle(10, 100, 0, height / 6, "red"), ["As you look through the window, your mind wanders.", "What am I doing?"], 350, 0);
			fuck(window1);
			gameObjects.push(window1);

			var window2 = new NPC(new Rectangle(10, 100, 0, height / 6 + height / 2, "red"), ["You know now.", "This window isn't unique."], 150, 0);
			fuck(window2);
			gameObjects.push(window2);

			var couch = new NPC(new Rectangle(175, 100, width/2, height - 50, "red"), ["The couch's tongue wriggles between your fingers.", "It snaps at your hand, and takes a finger in the proccess."], 0, -25);
			fuck(couch);
			gameObjects.push(couch);

			var tv = new NPC(new Rectangle(100, 50, width/2, height / 2 + height / 6, "red"), ["The T.V. is picking up a broadcast.", "It's televised evangelisim."], 0, 0);
			fuck(tv);
			gameObjects.push(tv);
			player.sequence++;
			break;
			case 69:
			gameObjects = [];
			gameObjects.push(new TextBox(["Is this really the answer you were looking for?"], width / 2, height / 2));
			setTimeout(function(){
				gameObjects.push(player);
				player.sequence = -1;
				player.playedPreviously = true;
				player.x = width / 2;
				player.y = height / 2;
			}, 1600);
			player.sequence++;
			break;
			case 99:
			gameObjects = [];
			gameObjects.push(new TextBox(["Your friends would have it no more.", "It's a dog eat dog world, and they ate you first."], width / 2, height / 2));
			player.previouslyDark = true;
			setTimeout(function(){
				gameObjects.push(player);
				player.sequence = -1;
				player.playedPreviously = true;
				player.x = width / 2;
				player.y = height / 2;
			}, 3100);
			break;
			case 127:
			gameObjects = [];
			gameObjects.push(new TextBox(["Your ticket to heaven?", "Lies."], width / 2, height / 2));
			player.previouslyDark = false;
			setTimeout(function(){
				gameObjects.push(player);
				player.sequence = -1;
				player.playedPreviously = true;
				player.x = width / 2;
				player.y = height / 2;
			}, 3100);
			break;
		}
	}

	handleInput(){
		this.dx = 0;
		this.dy = 0;
		if(titleScreen.gameStarted && !player.isReading){
			if(controls.up){
				this.dy = -this.speed;
			} if(controls.down){
				this.dy = this.speed;
			} if(controls.right){
				this.dx = this.speed;
			} if(controls.left){
				this.dx = -this.speed;
			} if(controls.action){
				//handle actions here.
				//I never actually did anything here.
				//I could just delete this spot and move on with my life, but I feel like I should have done something here.
			}
		}
	}
}

//rectangle class, which is what most of our objects will look like graphically
class Rectangle{
	constructor(width, height, x, y, color){
		this.width = width;
		this.height = height;
		this.x = x;
		this.y = y;
		this.color = color;
	}
	act(){
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height); //draw with our x and y at the center and not the top left because it makes collisions easier
		//I thought this would make things easier, but it didn't. It didn't at all.
	}
}

//a class to handle our inanimate objects and maybe other people?
class NPC {
	constructor(drawable, thoughts, ox, oy){
		this.thoughts = thoughts; //thoughts if the player just thinks when they interact
		this.drawable = drawable; //the npc has to be drawn right???
		this.ox = ox; //offset in the x direction for the text box
		this.oy = oy; //and the offset for the y
		this.specialFunction; //so uh this design is really dumb, but it's late and i'm really just hacking this thing together...
		this.playerNoticed = false; //has senpai noticed us?
	}

	//the npc act should really just check if they're touching the player and the player wants to talk and then start talking.
	//uh they kinda do? They check if the players close. I feel like this decision is mostly responsible for some of the performance issues you might find
	//because all npcs all the screen and checking their distance from the player multiple times
	act(){
		this.drawable.act(); //draw the NPC's shape

		if(typeof this.specialFunction !== 'undefined'){ //so we can bind our own functions.........
			this.specialFunction();
		}

		if (isClose(player, this.drawable)){
			if(isColliding(player, this.drawable)){ //a tiny bit of optimization(only check if we're colliding if we're close)
				player.canMove = false;				//this optimization actually makes thing a little weird sometimes... 
		}
		if(controls.action && !player.isReading && this.thoughts.length > 0){
			player.isReading = true;

			if(!this.playerNoticed){
				this.playerNoticed = true;
				player.talkedTo++;
			}

			if(this.ox != 0 || this.oy != 0){ //kicking into manual override
				gameObjects.push(new TextBox(this.thoughts, player.x + player.radius / 2 + this.ox, player.y + player.radius / 2 - this.drawable.height / 2 + this.oy));
			} else {
				if(player.y > this.drawable.y){
					gameObjects.push(new TextBox(this.thoughts, player.x + player.radius / 2, player.y + player.radius / 2 + this.drawable.height / 2 + player.radius));
				} else {
					gameObjects.push(new TextBox(this.thoughts, player.x + player.radius / 2, player.y + player.radius / 2 - this.drawable.height / 2 - player.radius));
				}
			}
		}
	}
}
}

//Just a little title screen for us
//so it feels a little more game like.
//some classes are small and simple
//others are not
class TitleScreen {
	constructor(){
		this.gameStarted = false;
	}

	act(){
		if(controls.action){
			this.gameStarted = true; //the player pressed e so the game has started
			gameObjects.pop(); 		 //and we're going to remove the title from the gameObjects so we're no longer calling it for no reason. (gotta save that performance!)
		} else {
			ctx.fillStyle = "#FFF";
			ctx.font = "50px Arial";
			ctx.fillText("Textual Enlightenment", width / 2 - 250, height / 2 - 200);
			ctx.font = "30px Arial";
			ctx.fillText("Press E to begin", width / 2 - 100, height / 2 - 150);
		}
	}
}

//A textBox for drawing our text at the bottom of the screen and feel cool about it
//originally this was an RPG style square text box but it just felt weird and then I never renamed it
class TextBox {
	constructor(dialogue, x, y){
		this.dialogue = dialogue;
		this.x = x;
		this.y = y;
		this.boundToPlayer = false;
		this.arrayPosition = 0;
		this.lastDraw = Date.now(); //want to be able to know when to draw the next line of text
		this.delay = 1500;				//how long to wait between draws
		//this is funnily one of the few times I didn't use magic numbers.
	}
	act(){
		if(Date.now() > this.lastDraw + this.delay){
			this.lastDraw = Date.now();
			if(typeof this.dialogue[++this.arrayPosition] === "undefined"){
				player.isReading = false;
				gameObjects.pop();
			}
		}
		ctx.font = "30px Arial";
		ctx.fillStyle = "#FFF";
		var textWidth = ctx.measureText(this.dialogue[this.arrayPosition]).width
		if(typeof this.dialogue[this.arrayPosition] !== "undefined"){ //just because the undef will draw for just a second if we don't
			if(this.boundToPlayer){
				ctx.fillText(this.dialogue[this.arrayPosition], player.x - textWidth / 2, player.y - 30);
			} else {
				ctx.fillText(this.dialogue[this.arrayPosition], this.x - textWidth / 2, this.y);
			}
		}
	}
}

//a simple class to hold the current value of the  controls
//I'm not sure why this is even a class...
class Controls {
	constructor(){
		this.up = false;
		this.down = false;
		this.left = false;
		this.right = false;
		this.action = false;
	}
}

//a full width boundry to make up for my shit collision detection
//I actually fixed collision issues later on but this still ends up acting
//as a way of marking screen boundries and transitioning between them.
class Boundry {
	constructor(x, y){
		this.y = y;
		this.x = x;
		this.left = true;
	}
	act(){
		var ay = player.y + player.dy;
		var ax = player.x + player.dx;
		if(this.y != 0){ //y style boundry, just stop them from moving
			if(ay >= this.y){
				player.canMove = false;
				if(typeof this.transition !== 'undefined'){
					this.transition();
				}
			}
		} else { //otherwise we're doing screen transition style
			if(this.left){
				if(ax <= this.x + player.radius * 2){
					player.screenPos++;
					player.x = 1135;
					player.needsUpdate = true;
					gameObjects = [];
					gameObjects.push(player);
				}
			} else {
				if(ax >= this.x - player.radius * 2){
					player.screenPos--;
					player.x = 100;
					player.needsUpdate = true;
					gameObjects = [];
					gameObjects.push(player);
				}
			}
		}
	}
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
//add a couple of listeners so we can tell when a key is up or down

var canvas = document.getElementById("gameCanvas"); //the canvas! it's where  we do the things
var ctx = canvas.getContext("2d"); //so we know how to draw things (2 dimensionally)

var width = canvas.width;
var height = canvas.height;
var gameObjects = [];
var controls = new Controls();
var player = new Player(20, width/2, height/2);
var titleScreen = new TitleScreen();
var carCreator = function(x, y, up){ //creates a car
	var car = new NPC(new Rectangle(200, 100, x, y, "grey"), ["Vroom."], 0, 0);
	car.specialFunction = function(){
		if(isColliding(player, car.drawable) && !player.undead){
			player.sequence = 69; //heh
		}

		if(car.drawable.x <= 0){
			car.drawable.x = width;
		}

		if(up){
			car.drawable.x -= 5;
		} else {
			car.drawable.x += 5;
		}
	}
	return car;
}

var attack = function(t){ //down with the establishment
	t.specialFunction = function(){
		if(player.x > t.drawable.x){
			t.drawable.x += 1;
		} else {
			t.drawable.x -= 1;
		}

		if(player.y > t.drawable.y){
			t.drawable.y += 1;
		} else {
			t.drawable.y -= 1;
		}

		if(isColliding(player, t.drawable)){
			player.sequence = 99;
		}
	}
}

//just some variables that we'll actually need to get things running probably.

gameObjects.push(player);
gameObjects.push(new NPC(new Rectangle(100, 50, width/2, 25, "grey"), ["The fridge hums to you the song of it's people.", "You hum along harmoniously."], 0, 100));
gameObjects.push(new NPC(new Rectangle(100, 100, width/4, 200, "grey"), ["You stare at the table.", "The table stares back at you.", "You're not sure what it wants."], 0, 0));
gameObjects.push(new NPC(new Rectangle(10, 100, 0, height / 6, "grey"), ["As you look through the window, your mind wanders.", "Will it always be like this?"], 350, 0));
gameObjects.push(new NPC(new Rectangle(10, 100, 0, height / 6 + height / 2, "grey"), ["You realize this window is no different than any other.", "The window seems offended."], 320, 0));
gameObjects.push(new NPC(new Rectangle(175, 100, width/2, height - 50, "grey"), ["The couch's tongue wriggles between your fingers.", "It beckons for you to stay."], 0, -25));
gameObjects.push(new NPC(new Rectangle(100, 50, width/2, height / 2 + height / 6, "grey"), ["Static fills the T.V.", "How calming."], 0, 0));
gameObjects.push(titleScreen); //this always has to be last because it's always going to pop itself from the array lmao

setInterval(draw, 12); //this is the meat this line right here is the core of the WHOLE thing

function spawnCars(){ //just a little time saver
	gameObjects.push(carCreator(width / 2 + width / 8, height / 4, true));
	gameObjects.push(carCreator(width, height / 8, true));
	gameObjects.push(carCreator(width / 2 - width / 4, height / 4, true));
}

//draws everything and tells them they can do their things
//it's so small, and so simple, and it works pretty well!
//it's just the other code that doesn't complement it.
function draw(){
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, width, height);
	gameObjects.forEach(function(object){
		object.act();
	});
}

//checks if the player is at the edge of the screen
function isAtEdge(object){
	var ay = object.y + object.width + object.dy;
	var ax = object.x + object.height + object.dx;

	return ((ay >= canvas.height || ay <= object.height * 2) || (ax >= canvas.width || ax <= object.width * 2));
}

//check if an object is at the edge of the screen...
function isObjectAtEdge(object){
	var ay = object.y + object.width;
	var ax = object.x + object.height;
	return ((ay >= canvas.height || ay <= object.height) || (ax >= canvas.width || ax <= object.width));
}

//checks if the player and an object are colliding
//it's a little hacky (note the magic numbers) but it's good enough!
function isColliding(rect1, rect2){
	var ax = player.x + player.dx;
	var ay = player.y + player.dy;
	if(ax < rect2.x - (rect2.width / 2) || ax > rect2.x + (rect2.width / 2)){
		var distance = Math.sqrt(Math.pow(ax - rect2.x, 2) + Math.pow(ay - rect2.y, 2));
		return (distance < rect1.radius + rect2.width / 2);
	} else {
		var distance = Math.sqrt(Math.pow(0, 2) + Math.pow(ay - rect2.y, 2));
		return (distance < rect1.radius + rect2.height / 2);
	}
}

//checks if the player is close enough to talk to
function isClose(rect1, rect2){
	var ax = player.x + player.dx;
	var ay = player.y + player.dy;
	if(ax <= rect2.x - (rect2.width / 2) || ax >= rect2.x + (rect2.width / 2)){
		var distance = Math.sqrt(Math.pow(ax - rect2.x, 2) + Math.pow(ay - rect2.y, 2));
		return (distance < rect1.radius + rect2.width / 2 + 20);
	} else {
		var distance = Math.sqrt(Math.pow(0, 2) + Math.pow(ay - rect2.y, 2));
		return (distance < rect1.radius + rect2.height / 2 + 20);
	}
}

//handles key down press
function keyDownHandler(e){
	if(e.keyCode == 68){
		controls.right = true;
	} else if(e.keyCode == 65) {
		controls.left = true;
	} else if(e.keyCode == 87) {
		controls.up = true;
	} else if(e.keyCode == 83) {
		controls.down = true;
	} else if(e.keyCode == 69) {
		controls.action = true;
	} else if(e.keyCode == 76){
		console.log(player);
	}
}

//handle key up press
function keyUpHandler(e){
	if(e.keyCode == 68){
		controls.right = false;
	} else if(e.keyCode == 65) {
		controls.left = false;
	} else if(e.keyCode == 87) {
		controls.up = false;
	} else if(e.keyCode == 83) {
		controls.down = false;
	} else if(e.keyCode == 69) {
		controls.action = false;
	}
}
// 600+ lines of eww.