const Height = 500,
  Width = 950,
  c = document.getElementById("canvas"),
  ctx = c.getContext("2d");

var player = {
  x: 50,
  y: Height / 2 - 5,
  h: 28,
  w: 56,
  speed: 4,
  texture: document.getElementById("playership"),
  textureidle1: document.getElementById("playership"),
  textureidle2: document.getElementById("playership2"),
  textureSlow: document.getElementById("playershipSlow"),
  textureTurbo: document.getElementById("playershipTurbo")
};
let oldTime = Date.now(), weaponDelay = 500, projectilesArray = [], gameOver = false,
  enemiesArray = [], lastSpawn = 0, enemyNum = Math.floor((Math.random() * 25) + 75), // between 75-100 enemies, NOT USED
  gifDate = Date.now();

function checkCollision(elem1,elem2){
  if (elem1.x < elem2.x + elem2.w && elem1.x + elem1.w > elem2.x &&
   elem1.y < elem2.y + elem2.h && elem1.h + elem1.y > elem2.y)
    return true;
  return false;
}

function Projectile(x,y,enemy){
  this.h = 7;
  this.x = x;
  this.y = y;
  this.speed = 10;
  if(enemy){
    this.enemy = true;
    this.color = "red";
    this.w = 14;
    this.speed = Math.floor((Math.random() * 8)) + 6;
    this.texture = document.getElementById("enemyProj");
  }else{
    this.enemy = false;
    this.color = "white";
    this.w = 7;
    this.speed = 10;
    this.texture = document.getElementById("playerProj");
  }
}
function Enemy(){
  this.w = 56;
  this.h = 56;
  this.x = Width-10;
  this.y = Math.floor((Math.random() * Height-this.h*2)) + this.h;
  this.speed = Math.floor((Math.random() * 5)) + 1;
  this.fireTime = Date.now();
  this.fireRate = Math.floor((Math.random() * 1500)) + 500;
  this.texture = document.getElementById("enemyship")
}
// enemy shoot function
Enemy.prototype.projectile = function(){
  let time = Date.now();
  if(time > this.fireTime + this.fireRate){
    this.fireTime = time;
    projectilesArray.push(new Projectile(this.x-10,this.y+this.h/2,true));
  }
}
// enemies and projectiles destroy themselves if they go out of canvas
Object.prototype.suicide = function(){
  if(this.x + this.w < 0 || this.x > Width)
    return true;  
  return false;
}
// every object draws itself
Object.prototype.drawTexture = function(){
  ctx.drawImage(this.texture, this.x, this.y, this.w, this.h);
}

function KeyListener() {
  this.pressedKeys = [];
  this.keydown = function (e) {
    this.pressedKeys[e.keyCode] = true;
  };
  this.keyup = function (e) {
    this.pressedKeys[e.keyCode] = false;
  };
  document.addEventListener("keydown", this.keydown.bind(this));
  document.addEventListener("keyup", this.keyup.bind(this));
}
KeyListener.prototype.isPressed = function (key) {
  return this.pressedKeys[key] ? true : false;
};
KeyListener.prototype.addKeyPressListener = function (keyCode, callback) {
  document.addEventListener("keypress", function (e) {
    if (e.keyCode == keyCode) callback(e);
  });
};
var keys = new KeyListener();

// choose player image when static
function animate(a,b,date){
  if(date > gifDate + 200){
    gifDate = date;
    ((player.texture === a) ? player.texture = b : player.texture = a);
  }
}

function move(){
  let date = Date.now();
  animate(player.textureidle1,player.textureidle2,date);  
  if ((keys.isPressed(65) || keys.isPressed(37)) && player.x > 0){
    player.x -= player.speed; // LEFT
    player.texture = player.textureSlow;
  }
  if ((keys.isPressed(68) || keys.isPressed(39)) && player.x + player.w < Width){
    player.x += player.speed; // RIGHT
    player.texture = player.textureTurbo;
  }
  if ((keys.isPressed(87) || keys.isPressed(38)) && player.y > 0)
    player.y -= player.speed; // UP
  if ((keys.isPressed(83) || keys.isPressed(40)) && player.y + player.w < Height)
    player.y += player.speed; // DOWN
  // shoot every x ms if spacebar pressed
  if(keys.isPressed(32)){
    let d = new Date(), newTime = d.getTime();
    if(newTime > oldTime + weaponDelay){
      projectilesArray.push(new Projectile(player.x+player.w,player.y+player.h/2));
      oldTime = newTime;
    }
  }
  // projectile movement
  let projLength = projectilesArray.length;
  if(projLength){
    for(var i = 0; i < projLength; ++i){
      if(!projectilesArray[i].enemy)
        projectilesArray[i].x += projectilesArray[i].speed;
      else
        projectilesArray[i].x -= projectilesArray[i].speed;
    }
  }
  // enemies spawn
  let time = Date.now(),
  spawnRate = Math.floor((Math.random() * 5000))+ 500;
  // see if its time to spawn a new object
  if (time > (lastSpawn + spawnRate)) {
      lastSpawn = time;
      enemiesArray.push(new Enemy());
  }
  // enemies movement
  let enemiesLength = enemiesArray.length;
  if(enemiesLength){
    for(var i = 0; i < enemiesLength; ++i){
      enemiesArray[i].x -= enemiesArray[i].speed;
      enemiesArray[i].projectile();
    }
  }
  // check all collisions
  // proj and player
  for(var i = projLength - 1; i >= 0; i--){
    if(projectilesArray[i].enemy && checkCollision(player,projectilesArray[i]))
      gameOVER();
    else if(!projectilesArray[i].enemy){
      for (var k = enemiesLength - 1; k >= 0; k--) {
        if(checkCollision(enemiesArray[k],projectilesArray[i])){
          enemiesArray.splice(k,1);
          projectilesArray.splice(i,1);
          return;
        }
      }
    }
  }
  // player and enemies
  for(var i = 0; i < enemiesLength; ++i){
    if(checkCollision(player,enemiesArray[i]))
      gameOVER();
  }
  // delete unused proj
  for (var i = projLength -1; i >= 0; i--){
    if(projectilesArray[i].suicide())
      projectilesArray.splice(i,1);
  }
  // delete unused enemies
  for (var i = enemiesLength -1; i >= 0; i--){
    if(enemiesArray[i].suicide())
      enemiesArray.splice(i,1);
  }
}

function draw() {
  // canvas base
  ctx.clearRect(0, 0, Width, Height);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, Width, Height);
  // projectiles  
  for(var i = 0, projLength = projectilesArray.length; i < projLength; ++i){
    projectilesArray[i].drawTexture();
  }
  //enemies
  for (var i = 0, enemiesLength = enemiesArray.length; i < enemiesLength; ++i)
    enemiesArray[i].drawTexture();
  // player
  player.drawTexture();
}

function gameOVER(){
  gameOver = true;
  console.log("Game Over")
}

function loop() {
  if(gameOver)
    return;
  move();
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);