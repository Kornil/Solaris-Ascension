'use strict';

const Height = 500, Width = 950,
  c = document.getElementById("canvas"), ctx = c.getContext("2d"),
  texture = {
    playerIdle1: document.getElementById("playership"),
    playerIdle2: document.getElementById("playership2"),
    playerTurbo: document.getElementById("playershipTurbo"),
    playerSlow: document.getElementById("playershipSlow"),
    enemyProj: document.getElementById("enemyProj"),
    playerProj: document.getElementById("playerProj"),
    enemyCruiser: document.getElementById("enemyCruiser"),
    cruiserProj: document.getElementById("cruiserProj2"),
  },
  shiptype = {
    cruiser: "cruiser",
    frigate: "frigate"
  };

let projectilesArray = [], gameOver = false, enemiesArray = [], lastSpawn = 0,
  enemyNum = Math.floor((Math.random() * 25) + 75); // between 75-100 enemies, NOT USED

class allPrototypes {
  suicide(){
    if(this.x + this.w < 0 || this.x > Width || this.y + this.h < 0 || this.y > Height)
      return true;
    return false;
  }
  drawTexture(){
    ctx.drawImage(this.texture, this.x, this.y, this.w, this.h);
  }
  move(){
    //((this.enemy) ? this.x -= this.speedX : this.x += this.speedX);
    if(this.enemy){
      if(this.type && this.type == shiptype.cruiser && this.goleft){
        this.x -= this.speedX;
        if(this.x < Width*0.8)
          this.goleft = false;
      }else if(this.type && this.type == shiptype.cruiser && !this.goleft){        
        this.x += this.speedX;
        if(this.x > Width-this.w)
          this.goleft = true;
      }else{   
        this.x -= this.speedX;
        if(this.speedY)
          this.y -= this.speedY;
      }
    }else{
      this.x += this.speedX;
    }
  }
  checkCollision(elem){
    if (this.x < elem.x + elem.w && this.x + this.w > elem.x &&
     this.y < elem.y + elem.h && this.h + this.y > elem.y)
      return true;
    return false;
  }
}

class Player extends allPrototypes {
  constructor(){
    super();
    this.x = 50;
    this.y = Height / 2 - 5;
    this.h = 28;
    this.w = 56;
    this.speed = 4;
    this.weaponDelay = 200;
    this.gifDate = Date.now();
    this.shootDate = Date.now();
    this.texture = texture.playerIdle1;
  }; 
  // prototypes of Player constructor
  animate(){
    let date = Date.now();
    if(date > this.gifDate + 200){
      ((this.texture === texture.playerIdle1) ? this.texture=texture.playerIdle2 : this.texture=texture.playerIdle1);      
      this.gifDate = date;
    }
  };
  keyMove(){
    if ((keys.isPressed(65) || keys.isPressed(37)) && this.x > 0){
      this.x -= this.speed; // LEFT
      this.texture = texture.playerSlow;
    }
    if ((keys.isPressed(68) || keys.isPressed(39)) && this.x + this.w < Width){
      this.x += this.speed; // RIGHT
      this.texture = texture.playerTurbo;
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
  };
};
let player = new Player();

class Projectile extends allPrototypes {
  constructor(x,y,h,enemy,type){
    super();
    this.h = 7;
    this.x = x-10;
    this.y = y+h/2;
    if(enemy){
      this.enemy = true;
      if(type == shiptype.cruiser){
        this.h = 16;
        this.w = 20;
        this.thrust = 4;
        let tx = player.x - x, ty = player.y - y,
        dist = Math.sqrt(tx*tx+ty*ty);
        this.speedX = -(tx/dist)*this.thrust;
        this.speedY = -(ty/dist)*this.thrust;
        this.texture = texture.cruiserProj;
      }else{  
        this.speedX = 7;
        this.texture = texture.enemyProj;
        this.w = 14;
      }
    }else{
      this.w = 7;
      this.speedX = 10;
      this.texture = texture.playerProj;
    }
  }
};

function enemyType(){
  let rand = Math.floor(Math.random() * 10) + 1,
    countCruisers = 0;
    enemiesArray.map( function(i){if(i.type == shiptype.cruiser) countCruisers++});
  if(rand <= 2 && countCruisers < 3){
    return shiptype.cruiser;
  }
  return shiptype.frigate;
}

class Enemy extends allPrototypes {
  constructor(type){
    super();
    if(type == shiptype.cruiser){
      this.w = 56;
      this.h = 56;
      this.type = type;
      this.speedX = 0.5;
      this.fireRate = 3500;
      this.goleft = true;
      this.texture = texture.enemyCruiser;
    }else{
      this.w = 28;
      this.h = 28;
      this.type = type;
      this.speedX = 2;
      this.fireRate = 1500;
      this.texture = texture.enemyCruiser;
    }
    this.x = Width-10;
    this.enemy = true;
    this.fireTime = 0;
    this.y = Math.floor(Math.random() * (Height - (this.h*2) + 1));
  }
  projectile(){
    let time = Date.now();
    if(time > this.fireTime + this.fireRate){
      this.fireTime = time;
      projectilesArray.push(new Projectile(this.x-10,this.y,this.h,true,this.type));
    }
  }
};

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

function update(){
  // canvas base
  ctx.clearRect(0, 0, Width, Height);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, Width, Height);
  ctx.imageSmoothingEnabled = false;
  player.keyMove();
  player.animate();
  player.drawTexture();
  // enemies spawn
  let time = Date.now(),
  spawnRate = Math.floor((Math.random() * (5000-500+1)))+ 500;
  // see if its time to spawn a new object
  if (time > (lastSpawn + spawnRate)) {
      lastSpawn = time;
      enemiesArray.push(new Enemy(enemyType()));
  }
  // enemy move, collision with player, and garbage collection
  for(var i = enemiesArray.length - 1; i >= 0; i--){
    enemiesArray[i].move();
    if(enemiesArray[i].checkCollision(player)) gameOVER();
    enemiesArray[i].projectile();
    enemiesArray[i].drawTexture();
    if(enemiesArray[i].suicide()) enemiesArray.splice(i,1);
  }
  // projectile movement, collision(player, enemy), and garbage collection
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
  console.log("Game Over");
}

function loop() {
  if(gameOver)
    return;
  update();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);