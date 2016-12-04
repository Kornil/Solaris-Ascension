const Height = 500, Width = 950,
  c = document.getElementById("canvas"), ctx = c.getContext("2d");
let projectilesArray = [], gameOver = false, enemiesArray = [], lastSpawn = 0,
  enemyNum = Math.floor((Math.random() * 25) + 75); // between 75-100 enemies, NOT USED

let player = {
  x: 50,
  y: Height / 2 - 5,
  h: 28,
  w: 56,
  speed: 4,
  weaponDelay: 500,
  gifDate: Date.now(),
  shootDate: Date.now(),
  texture: document.getElementById("playership"),
  textureidle1: document.getElementById("playership"),
  textureidle2: document.getElementById("playership2"),
  textureSlow: document.getElementById("playershipSlow"),
  textureTurbo: document.getElementById("playershipTurbo"),
  animate: function(){
    let date = Date.now();
    if(date > this.gifDate + 200){
      ((this.texture === this.textureidle1) ? this.texture=this.textureidle2 : this.texture=this.textureidle1);      
      this.gifDate = date;
    }
  },
  move: function(){
    if ((keys.isPressed(65) || keys.isPressed(37)) && this.x > 0){
      this.x -= this.speed; // LEFT
      this.texture = this.textureSlow;
    }
    if ((keys.isPressed(68) || keys.isPressed(39)) && this.x + this.w < Width){
      this.x += this.speed; // RIGHT
      this.texture = this.textureTurbo;
    }
    if ((keys.isPressed(87) || keys.isPressed(38)) && this.y > 0) this.y -= this.speed; // UP
    if ((keys.isPressed(83) || keys.isPressed(40)) && this.y + this.h < Height) this.y += this.speed; // DOWN
    // shoot every x ms if spacebar pressed
    if(keys.isPressed(32)){
      let date = Date.now();
      if(date > this.shootDate + this.weaponDelay){
        projectilesArray.push(new Projectile(this.x+this.w,this.y+this.h/2));
        this.shootDate = date;
      }
    }
  }
};

function Projectile(x,y,enemy){
  this.h = 7;
  this.x = x;
  this.y = y;
  if(enemy){
    this.enemy = true;
    this.w = 14;
    this.speed = Math.floor((Math.random() * (8-6+1))) + 6;
    this.texture = document.getElementById("enemyProj");
  }else{
    this.w = 7;
    this.speed = 10;
    this.texture = document.getElementById("playerProj");
  }
}

function Enemy(){
  this.w = 56;
  this.h = 56;
  this.x = Width-10;
  this.enemy = true;
  this.y = Math.floor((Math.random() * (Height - this.h*2+1))) + this.h;
  this.speed = Math.floor((Math.random() * 5)) + 1;
  this.fireTime = Date.now();
  this.fireRate = Math.floor((Math.random() * (1500-500+1))) + 500;
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
// enemyship and projectiles movement
Object.prototype.move = function(){
  ((this.enemy) ? this.x -= this.speed : this.x += this.speed);  
}
// check collision 
Object.prototype.checkCollision = function(elem){
  if (this.x < elem.x + elem.w && this.x + this.w > elem.x &&
   this.y < elem.y + elem.h && this.h + this.y > elem.y)
    return true;
  return false;
}

function KeyListener() {
  this.pressedKeys = [];
  this.keydown = (e) => {
    this.pressedKeys[e.keyCode] = true;
  };
  this.keyup = (e) => {
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

function moveDraw(){
  // canvas base
  ctx.clearRect(0, 0, Width, Height);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, Width, Height);
  player.move();
  player.animate();
  player.drawTexture();
  // enemies spawn
  let time = Date.now(),
  spawnRate = Math.floor((Math.random() * (5000-500+1)))+ 500;
  // see if its time to spawn a new object
  if (time > (lastSpawn + spawnRate)) {
      lastSpawn = time;
      enemiesArray.push(new Enemy());
  }
  // enemy move, collision with player, and garbage collection
  for(var i = enemiesArray.length - 1; i >= 0; i--){
    enemiesArray[i].move();
    if(enemiesArray[i].checkCollision(player)) gameOVER();
    enemiesArray[i].projectile();
    enemiesArray[i].drawTexture();
    if(enemiesArray[i].suicide()) enemiesArray.splice(i,1);
  }
  // projectile movement, collision, and garbage collection
  for(var i = projectilesArray.length - 1; i >= 0; i--){
    projectilesArray[i].move();
    if(projectilesArray[i].enemy && projectilesArray[i].checkCollision(player)) gameOVER();
    else if(!projectilesArray[i].enemy){
      for(var k = enemiesArray.length - 1; k >= 0; k--){
        if(projectilesArray[i].checkCollision(enemiesArray[k])){
          enemiesArray.splice(k,1);
          projectilesArray.splice(i,1);
          return;
        }
      }
    }
    projectilesArray[i].drawTexture(); 
    if(projectilesArray[i].suicide()) projectilesArray.splice(i,1);
  }  
}

function gameOVER(){
  gameOver = true;
  console.log("Game Over")
}

function loop() {
  if(gameOver)
    return;
  moveDraw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);