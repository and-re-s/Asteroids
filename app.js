document.addEventListener("DOMContentLoaded", () => {
  const FPS = 30;
  const FRICTION = 0.7;
  const SHIP_SIZE = 30;
  const SHIP_THRUST = 5;
  const TURN_SPEED = 360;

  let canv = document.getElementById("gameCanvas");
  let ctx = canv.getContext("2d");

  let ship = {
    x: canv.width / 2,
    y: canv.height / 2,
    r: SHIP_SIZE / 2,
    a: (90 / 180) * Math.PI,
    rot: 0,
    thrusting: false,
    thrust: {
      x: 0,
      y: 0,
    },
  };

  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);

  setInterval(update, 1000 / FPS);

  function keyDown(ev) {
    switch (ev.key) {
      case "ArrowUp":
        ship.thrusting = true;
        break;
      case "ArrowRight":
        ship.rot = (-(TURN_SPEED / 180) * Math.PI) / FPS;
        break;
      case "ArrowLeft":
        ship.rot = ((TURN_SPEED / 180) * Math.PI) / FPS;
        break;
    }
  }

  function keyUp(ev) {
    switch (ev.key) {
      case "ArrowUp":
        ship.thrusting = false;
        break;
      case "ArrowRight":
        ship.rot = 0;
        break;
      case "ArrowLeft":
        ship.rot = 0;
        break;
    }
  }

  function update() {
    // draw space
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.clientWidth, canv.height);

    //thrust the ship
    if (ship.thrusting) {
      ship.thrust.x += (SHIP_THRUST * Math.cos(ship.a)) / FPS;
      ship.thrust.y -= (SHIP_THRUST * Math.sin(ship.a)) / FPS;
      // draw thruster
      ctx.fillStyle = "red";
      ctx.strokeStyle = "yellow";
      ctx.lineWidht = SHIP_SIZE / 10;
      ctx.beginPath();
      ctx.moveTo(
        //  rear left
        ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
        ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
      );
      ctx.lineTo(
        // rear center
        ship.x - ship.r * ((5 / 3) * Math.cos(ship.a)),
        ship.y + ship.r * ((5 / 3) * Math.sin(ship.a))
      );
      ctx.lineTo(
        // rear right
        ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
        ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ship.thrust.x -= (FRICTION * ship.thrust.x) / FPS;
      ship.thrust.y -= (FRICTION * ship.thrust.y) / FPS;
    }

    // draw ship
    ctx.strokeStyle = "white";
    ctx.lineWidht = SHIP_SIZE / 20;
    ctx.beginPath();
    ctx.moveTo(
      // nose of the ship
      ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
      ship.y - (4 / 3) * ship.r * Math.sin(ship.a)
    );
    ctx.lineTo(
      // rear left
      ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + Math.sin(ship.a)),
      ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - Math.cos(ship.a))
    );
    ctx.lineTo(
      // rear right
      ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - Math.sin(ship.a)),
      ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + Math.cos(ship.a))
    );
    ctx.closePath();
    ctx.stroke();

    // rotating ship
    ship.a += ship.rot;

    // moving ship
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;

    if (ship.x < 0 - ship.r) {
      ship.x = canv.width + ship.r;
    } else if (ship.x > canv.width + ship.r) {
      ship.x = 0 - ship.r;
    }

    if (ship.y < 0 - ship.r) {
      ship.y = canv.height + ship.r;
    } else if (ship.y > canv.height + ship.r) {
      ship.y = 0 - ship.r;
    }

    // // central dot
    // ctx.fillStyle = "red";
    // ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2);
  }
});
