'use strict';

const Height = 500, Width = 950,
  c = document.getElementById("canvas"), ctx = c.getContext("2d"),
  texture = {
    playerIdle1: document.getElementById("playership"),
    playerDeath: document.getElementById("damagedPlayership"),
    playerIdle2: document.getElementById("playership2"),
    playerTurbo: document.getElementById("playershipTurbo"),
    playerSlow: document.getElementById("playershipSlow"),
    frigateProj: document.getElementById("frigateProj"),
    playerProj: document.getElementById("playerProj"),
    cruiser: document.getElementById("cruiser"),
    cruiserDamage: document.getElementById("cruiserDamage"),
    cruiserProj: document.getElementById("cruiserProj"),
    corvette: document.getElementById("corvette"),
    frigate: document.getElementById("frigate"),
    frigateDamage: document.getElementById("frigateDamage"),
  },
  shiptype = {
    cruiser: "cruiser",
    frigate: "frigate",
    corvette: "corvette",
  };

let player, projectilesArray = [], gameOver = true, enemiesArray = [], lastSpawn = 0, // <-- time since last ship, global
  enemyNum = Math.floor((Math.random() * 25) + 75); // between 75-100 enemies, NOT USED

// abstract class
class allPrototypes {
  suicide(){
    if(this.x + this.w < 0 || this.x > Width || this.y + this.h < 0 || this.y > Height || (this.hp && this.hp === 0))
      return true;
    return false;
  }
  drawTexture(){
    let texture = this.texture;
    if((this.hp+1 <= (this.maxHP)/2) && this.damageTexture) texture = this.damageTexture;
    ctx.drawImage(texture, this.x, this.y, this.w, this.h);
  }
  move(){
    if(this.enemy){
      if(this.type === shiptype.cruiser && this.goleft){
      // cruiser movement
        this.x -= this.speedX;
        if(this.x < Width*0.8)
          this.goleft = false;
      }else if(this.type === shiptype.cruiser && !this.goleft){
        if (this.originY >= this.y+this.verticalMov) this.down = true;
        else if(this.originY <= this.y-this.verticalMov) this.down = false;
        (this.down) ? this.y += this.speedY : this.y -= this.speedY;
      }else if( this.type === shiptype.frigate){
        // frigate movement
        if(!this.evacuate && this.x < Width*0.7){
          projectilesArray.push(new Projectile(this.x-10,this.y,this.h,true,this.type));
          (this.y >= Height/2) ? this.direction = "up" : this.direction = "down" ;
          this.evacuate = true;
        }else if(this.evacuate){          
          this.speedX += 0.1;
          (this.direction === "up") ? this.y += this.speedX : this.y -= this.speedX;          
        }
        this.x -= this.speedX;
      }else{
        // enemy projectile movement
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
        projectilesArray.push(new Projectile(this.x+this.w,this.y+this.h/2,false));
        this.shootDate = date;
      }
    }
  };
};

class Projectile extends allPrototypes {
  constructor(x,y,h,enemy,type){
    super();
    this.x = x-10;
    this.y = y+h/2;
    if(enemy){
      this.enemy = true;
      if(type === shiptype.cruiser){
        this.h = 16;
        this.w = 20;        
        this.thrust = 4;
        this.texture = texture.cruiserProj;
      }else if(type === shiptype.frigate){
        this.h = 7;
        this.w = 14;
        this.texture = texture.frigateProj;
        this.thrust = 8;
      }
      let tx = player.x - x, ty = player.y - y,
      dist = Math.sqrt(tx*tx+ty*ty);
      this.speedX = -(tx/dist)*this.thrust;
      this.speedY = -(ty/dist)*this.thrust;
    }else{
      this.h = 7;
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
  if(rand === 1 && countCruisers < 3) return shiptype.cruiser;
  else if(rand <= 5) return shiptype.frigate;
  else return shiptype.corvette;
}

class Enemy extends allPrototypes {
  constructor(type){
    super();
    this.type = type;
    if(type === shiptype.cruiser){
      this.w = 60;
      this.h = 62;
      this.speedX = 0.5;
      this.speedY = 0.5;
      this.fireRate = 3500;
      this.maxHP = 5; // <- 5 shots to take down
      this.hp = this.maxHP-1; // count from zero, used to change texture model on damage
      this.goleft = true;
      this.texture = texture.cruiser;
      this.damageTexture = texture.cruiserDamage;
      this.down = true;
      this.verticalMov = 40;
    }else if(type === shiptype.frigate){
      this.w = 30;
      this.h = 42;
      this.maxHP = 2; // <- 2 shots
      this.hp = this.maxHP-1;
      this.speedX = 3;
      this.texture = texture.frigate;
      this.damageTexture = texture.frigateDamage;
      this.evacuate = false;
    }else if(type === shiptype.corvette){
      this.w = 20;
      this.h = 16;
      this.speedX = 5;
      this.texture = texture.corvette;
    }
    this.x = Width-10;
    this.enemy = true;
    this.fireTime = 0;
    this.y = Math.floor(Math.random() * (Height - (this.h*2) + 1));
    this.originY = this.y+this.verticalMov;
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
let keys = new KeyListener();

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
  spawnRate = Math.floor(Math.random() * (1500-250+1))+ 250;
  // see if its time to spawn a new object
  if (time > (lastSpawn + spawnRate)) {
      lastSpawn = time;
      enemiesArray.push(new Enemy(enemyType()));
  }
  // enemy move, collision with player, and garbage collection
  for(let i = enemiesArray.length - 1; i >= 0; i--){
    enemiesArray[i].move();
    if(enemiesArray[i].checkCollision(player)) gameOVER();
    enemiesArray[i].projectile();
    enemiesArray[i].drawTexture();
    if(enemiesArray[i].suicide()) enemiesArray.splice(i,1);
  }
  // projectile movement, collision(player, enemy), and garbage collection
  for(let i = projectilesArray.length - 1; i >= 0; i--){
    projectilesArray[i].move();
    if(projectilesArray[i].enemy && projectilesArray[i].checkCollision(player)) gameOVER();
    else if(!projectilesArray[i].enemy){
      for(let k = enemiesArray.length - 1; k >= 0; k--){
        if(projectilesArray[i].checkCollision(enemiesArray[k])){
          if(enemiesArray[k].hp) enemiesArray[k].hp--;
          else enemiesArray.splice(k,1);          
          projectilesArray.splice(i,1);
          return;
        }
      }
    }
    projectilesArray[i].drawTexture(); 
    if(projectilesArray[i].suicide()) projectilesArray.splice(i,1);
  }
  if(gameOver){
    player.texture = texture.playerDeath;    
    player.drawTexture(); 
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, Width, Height);    
    ctx.font = "16px Inconsolata";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText("Click anywhere to start a new game.",Width/2,Height/2+50);
    ctx.fillStyle = "#f00";
    ctx.textAlign = "center";
    ctx.font = "36px Inconsolata";
    ctx.fillText("YOUR SHIP WAS DESTROYED!",Width/2,Height/2);
  }
}

let gameOVER; (gameOVER = function gameOVER(){
  if(!gameOver) console.log("Game Over");
  else {
    ctx.clearRect(0, 0, Width, Height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, Width, Height);
  }
  gameOver = true;
  document.addEventListener("click", newGame);
  ctx.font = "16px Inconsolata";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText("Click anywhere to start a new game.",Width/2,Height/2+50);
})();

function newGame(){
  document.removeEventListener('click', newGame, false);
  player = new Player();
  projectilesArray = [], gameOver = false, enemiesArray = [], lastSpawn = 0;
  loop();
};

function loop() {
  if(gameOver)
    return;
  update();
  requestAnimationFrame(loop);
};
