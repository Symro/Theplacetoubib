var canvas = document.querySelector('canvas'),
    ctx = canvas.getContext('2d'),
    particles = [],
    particleNum = 180,
    w = window.innerWidth,
    h = window.innerHeight,
    color = '#f8f8f8';

canvas.width = w;
canvas.height = h;

function ParticleCreator() {
  this.x = Math.round( Math.random() * w );
  this.y = Math.round( Math.random() * h );
  this.color = color;
  this.rad = Math.round( Math.random() * 0.5) + Math.round( Math.random() * 2);
  this.vx = Math.round( Math.random() * 5 ) - 2.5;
  this.vy = Math.round( Math.random() * 5 ) - 2.5; 
}


function drawParticles() {
  ctx.clearRect(0, 0, w, h);
  
  for (var i = 0; i < particleNum; i++) {
    var temp1 = particles[i];
    temp1.color = color;
    
    for (var j = 0; j < particleNum; j++) {
      if (i != j) {
        var temp2 = particles[j];

        if (temp1.color == temp2.color && distance(temp1, temp2) < 80 && distance(temp1, temp2) > 30) {
          ctx.strokeStyle = temp1.color;
          ctx.beginPath();
          ctx.moveTo(temp1.x, temp1.y);
          ctx.lineTo(temp2.x, temp2.y);
          ctx.stroke();
        }
      }
    }
    
    ctx.fillStyle = temp1.color;
    ctx.strokeStyle = temp2.color;
    
    ctx.beginPath();
    ctx.arc(temp1.x, temp1.y, temp1.rad, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.closePath();
    
    temp1.x += temp1.vx;
    temp1.y += temp1.vy;
    
    if (temp1.x > w) temp1.x = 0;
    if (temp1.x < 0) temp1.x = w;
    if (temp1.y > h) temp1.y = 0;
    if (temp1.y < 0) temp1.y = h;
  }
}

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

function distance(p1,p2){  
  return Math.sqrt( Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) );
}

(function init() {
  for (var i = 0; i < particleNum; i++) {
    particles.push(new ParticleCreator);
  }
})();

(function loop(){
  drawParticles();
  requestAnimFrame(loop);
})();