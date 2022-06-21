document.addEventListener("DOMContentLoaded", () => {
  const FPS = 30; // frames per second
  const FRICTION = 0.7; // friction coefficient of space (between 0 and 1)
  const GAME_LIVES = 3; // number of game lives
  const LASER_DIST = 0.6; // maximum distance laser can travel as fraction of screen width
  const LASER_EXPLODE_DUR = 0.1; // duration of the laser explosion
  const LASER_MAX = 10; // maximum ammount of laser shots on screen
  const LASER_SPD = 500; // speed of laser shot in pixels per second
  const ROIDS_JAG = 0.35; // jaggedness of asteroids (between 0 and 1)
  const ROIDS_PTS_LGE = 20; // number of points for hitting large asteroid
  const ROIDS_PTS_MED = 50; // number of points for hitting medium asteroid
  const ROIDS_PTS_SML = 100; // number of points for hitting small asteroid
  const ROIDS_NUM = 3; // starting number of asteroids
  const ROIDS_SIZE = 100; // starting size of asteroid in pixels
  const ROIDS_SPD = 50; // max starting asteroid speed
  const ROIDS_VERT = 10; // average number of vertices of each asteroid
  const SAVE_KEY_SCORE = "highscore"; // save key for local storage of high score
  const SHIP_BLINK_DUR = 0.1; // duration of ships blink during immortal period
  const SHIP_EXPLODE_DUR = 0.3; // duration of the ship explosion
  const SHIP_INV_DUR = 3; // duration of ship immortal period after restart
  const SHIP_SIZE = 30; // ship height in pixels
  const SHIP_THRUST = 5; // acceleration of ship in pixels per second^2
  const SHIP_TURN_SPEED = 360; // turn speed in degrees per second
  const SHOW_BOUNDING = false; // show or hide collision bounding
  const TEXT_FADE_TIME = 5; // time of fading text in seconds
  const TEXT_SIZE = 40; // size of text font in pixels

  let canv = document.getElementById("gameCanvas");
  let ctx = canv.getContext("2d");

  // set up the game parameters
  let level, lives, roids, score, scoreHigh, ship, text, textAlpha;
  newGame();

  // set up game loop
  setInterval(update, 1000 / FPS);

  // set up listeners of pushing control keys
  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);

  function createAsteroidBelt() {
    roids = [];
    let x, y;
    for (let i = 0; i < ROIDS_NUM + level; i++) {
      do {
        x = Math.floor(Math.random() * canv.width);
        y = Math.floor(Math.random() * canv.height);
      } while (
        distBetweenPoints(ship.x, ship.y, x, y) <
        ROIDS_SIZE * 2 + ship.r
      );
      roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2)));
    }
  }

  function destroyAsteroid(index) {
    let x = roids[index].x;
    let y = roids[index].y;
    let r = roids[index].r;

    // split the asteroid in two little ones if necessary
    if (r === Math.ceil(ROIDS_SIZE / 2)) {
      roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
      roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
      score += ROIDS_PTS_LGE;
    } else if (r === Math.ceil(ROIDS_SIZE / 4)) {
      roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
      roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
      score += ROIDS_PTS_MED;
    } else {
      score += ROIDS_PTS_SML;
    }

    // check high score
    if (score > scoreHigh) {
      scoreHigh = score;
      localStorage.setItem(SAVE_KEY_SCORE, scoreHigh);
    }

    // destroy asteroid
    roids.splice(index, 1);

    // new level where no more asteroids
    if (roids.length === 0) {
      level++;
      newLevel();
    }
  }

  function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  function drawShip(x, y, a, color = "white") {
    ctx.strokeStyle = color;
    ctx.lineWidth = SHIP_SIZE / 12;
    ctx.beginPath();
    ctx.moveTo(
      // nose of the ship
      x + (4 / 3) * ship.r * Math.cos(a),
      y - (4 / 3) * ship.r * Math.sin(a)
    );
    ctx.lineTo(
      // rear left
      x - ship.r * ((2 / 3) * Math.cos(a) + Math.sin(a)),
      y + ship.r * ((2 / 3) * Math.sin(a) - Math.cos(a))
    );
    ctx.lineTo(
      // rear right
      x - ship.r * ((2 / 3) * Math.cos(a) - Math.sin(a)),
      y + ship.r * ((2 / 3) * Math.sin(a) + Math.cos(a))
    );
    ctx.closePath();
    ctx.stroke();
  }

  function explodeShip() {
    ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
  }

  function gameOver() {
    ship.dead = true;
    text = "Game Over";
    textAlpha = 1;
  }

  function keyDown(ev) {
    if (ship.dead) {
      return;
    }

    switch (ev.key) {
      case " ":
        shootLaser();
        break;
      case "ArrowUp":
        ship.thrusting = true;
        break;
      case "ArrowRight":
        ship.rot = (-(SHIP_TURN_SPEED / 180) * Math.PI) / FPS;
        break;
      case "ArrowLeft":
        ship.rot = ((SHIP_TURN_SPEED / 180) * Math.PI) / FPS;
        break;
    }
  }

  function keyUp(ev) {
    if (ship.dead) {
      return;
    }

    switch (ev.key) {
      case " ":
        ship.canShoot = true;
        break;
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

  function newAsteroid(x, y, r) {
    let lvlMult = 1 + 0.1 * level;
    let roid = {
      x: x,
      y: y,
      xv:
        ((Math.random() * ROIDS_SPD * lvlMult) / FPS) *
        (Math.random() < 0.5 ? 1 : -1),
      yv:
        ((Math.random() * ROIDS_SPD * lvlMult) / FPS) *
        (Math.random() < 0.5 ? 1 : -1),
      r: r,
      a: Math.random() * Math.PI * 2,
      vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),
      offs: [],
    };

    // create the vertex offset array
    for (let i = 0; i < roid.vert; i++) {
      roid.offs.push(Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG);
    }

    return roid;
  }

  function newGame() {
    level = 0;
    score = 0;
    scoreHigh = localStorage.getItem(SAVE_KEY_SCORE) || 0;
    lives = GAME_LIVES;
    ship = newShip();
    newLevel();
  }

  function newLevel() {
    text = `Current level: ${level + 1}`;
    textAlpha = 1.0;
    createAsteroidBelt();
  }

  function newShip() {
    return {
      x: canv.width / 2,
      y: canv.height / 2,
      r: SHIP_SIZE / 2,
      a: (90 / 180) * Math.PI,
      blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
      blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
      canShoot: true,
      dead: false,
      explodeTime: 0,
      lasers: [],
      rot: 0,
      thrusting: false,
      thrust: {
        x: 0,
        y: 0,
      },
    };
  }

  function shootLaser() {
    // creating laser object
    if (ship.canShoot && ship.lasers.length < LASER_MAX) {
      ship.lasers.push({
        // set point where from laser is shooting
        x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
        y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a),
        xv: (LASER_SPD * Math.cos(ship.a)) / FPS,
        yv: -(LASER_SPD * Math.sin(ship.a)) / FPS,
        dist: 0,
        explodeTime: 0,
      });
    }

    // prevent further shooting
    ship.canShoot = false;
  }

  function update() {
    let blinkOn = ship.blinkNum % 2 === 0;
    let exploding = ship.explodeTime > 0;

    // draw space
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canv.clientWidth, canv.height);

    //thrust the ship
    if (ship.thrusting && !ship.dead) {
      ship.thrust.x += (SHIP_THRUST * Math.cos(ship.a)) / FPS;
      ship.thrust.y -= (SHIP_THRUST * Math.sin(ship.a)) / FPS;

      if (!exploding && blinkOn) {
        // draw thruster
        ctx.fillStyle = "red";
        ctx.strokeStyle = "yellow";
        ctx.lineWidht = SHIP_SIZE / 10;
        ctx.beginPath();
        ctx.moveTo(
          //  rear left part of the flame
          ship.x -
            ship.r * ((2 / 3) * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
          ship.y +
            ship.r * ((2 / 3) * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
        );
        ctx.lineTo(
          // rear center part of the flame
          ship.x - ship.r * ((5 / 3) * Math.cos(ship.a)),
          ship.y + ship.r * ((5 / 3) * Math.sin(ship.a))
        );
        ctx.lineTo(
          // rear right part of the flame
          ship.x -
            ship.r * ((2 / 3) * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
          ship.y +
            ship.r * ((2 / 3) * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else {
      ship.thrust.x -= (FRICTION * ship.thrust.x) / FPS;
      ship.thrust.y -= (FRICTION * ship.thrust.y) / FPS;
    }

    // draw ship
    if (!exploding) {
      if (blinkOn && !ship.dead) {
        drawShip(ship.x, ship.y, ship.a);
      }

      // handle blinking
      if (ship.blinkNum > 0) {
        // reduce blink time
        ship.blinkTime--;

        // reduce blink num
        if (ship.blinkTime === 0) {
          ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
          ship.blinkNum--;
        }
      }
    } else {
      ctx.fillStyle = "darkred";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 1.5, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "gold";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 1.2, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r * 0.4, 0, Math.PI * 2, false);
      ctx.fill();
    }

    if (SHOW_BOUNDING) {
      ctx.strokeStyle = "lime";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
      ctx.stroke();
    }

    // draw asteroids
    let x, y, r, a, vert;
    for (let i = 0; i < roids.length; i++) {
      ctx.strokeStyle = "slategrey";
      ctx.lineWidth = SHIP_SIZE / 20;
      // get asteroids properties;
      x = roids[i].x;
      y = roids[i].y;
      r = roids[i].r;
      a = roids[i].a;
      vert = roids[i].vert;
      offs = roids[i].offs;

      // drap a path
      ctx.beginPath();
      ctx.moveTo(x + r * offs[0] * Math.cos(a), y + r * offs[0] * Math.sin(a));
      // draw the poligon
      for (let j = 1; j < vert; j++) {
        ctx.lineTo(
          x + r * offs[j] * Math.cos(a + (j * Math.PI * 2) / vert),
          y + r * offs[j] * Math.sin(a + (j * Math.PI * 2) / vert)
        );
      }
      ctx.closePath();
      ctx.stroke();

      if (SHOW_BOUNDING) {
        ctx.strokeStyle = "lime";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2, false);
        ctx.stroke();
      }
    }

    // draw the lasers
    for (let i = 0; i < ship.lasers.length; i++) {
      if (ship.lasers[i].explodeTime === 0) {
        ctx.fillStyle = "salmon";
        ctx.beginPath();
        ctx.arc(
          ship.lasers[i].x,
          ship.lasers[i].y,
          SHIP_SIZE / 15,
          0,
          Math.PI * 2,
          false
        );
        ctx.fill();
      } else {
        // draw the explosion
        ctx.fillStyle = "orangered";
        ctx.beginPath();
        ctx.arc(
          ship.lasers[i].x,
          ship.lasers[i].y,
          ship.r * 0.75,
          0,
          Math.PI * 2,
          false
        );
        ctx.fill();
        ctx.fillStyle = "salmon";
        ctx.beginPath();
        ctx.arc(
          ship.lasers[i].x,
          ship.lasers[i].y,
          ship.r * 0.5,
          0,
          Math.PI * 2,
          false
        );
        ctx.fill();
        ctx.fillStyle = "pink";
        ctx.beginPath();
        ctx.arc(
          ship.lasers[i].x,
          ship.lasers[i].y,
          ship.r * 0.25,
          0,
          Math.PI * 2,
          false
        );
        ctx.fill();
      }
    }

    // draw game text
    if (textAlpha >= 0) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
      ctx.font = `small-caps ${TEXT_SIZE}px dejavu sans mono`;
      ctx.fillText(text, canv.width / 2, canv.height * 0.75);
      textAlpha -= 1 / TEXT_FADE_TIME / FPS;
    } else if (ship.dead) {
      newGame();
    }

    // draw the number of lives
    let liveColor;
    for (let i = 0; i < lives; i++) {
      liveColor = exploding && i === lives - 1 ? "red" : "white";
      drawShip(
        SHIP_SIZE + i * SHIP_SIZE * 1.2,
        SHIP_SIZE,
        0.5 * Math.PI,
        liveColor
      );
    }

    // draw the score
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = `${TEXT_SIZE}px dejavu sans mono`;
    ctx.fillText(score, canv.width - SHIP_SIZE / 2, SHIP_SIZE);

    // draw the high score
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = `${TEXT_SIZE * 0.6}px dejavu sans mono`;
    ctx.fillText(`High score: ${scoreHigh}`, canv.width / 2, SHIP_SIZE);

    // detecting laser hits an asteroid
    let ax, ay, ar, lx, ly;
    for (let i = roids.length - 1; i >= 0; i--) {
      // grab the asteroid properties
      ax = roids[i].x;
      ay = roids[i].y;
      ar = roids[i].r;

      for (let j = ship.lasers.length - 1; j >= 0; j--) {
        // grab the laser properties
        lx = ship.lasers[j].x;
        ly = ship.lasers[j].y;

        // detecting hit
        if (
          ship.lasers[j].explodeTime === 0 &&
          distBetweenPoints(ax, ay, lx, ly) < ar
        ) {
          // remove asteroid and activate laser sxplosion
          destroyAsteroid(i);
          ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS);
          break;
        }
      }
    }

    // check for asteroids collision
    if (!exploding) {
      if (ship.blinkNum === 0 && !ship.dead) {
        for (let i = 0; i < roids.length; i++) {
          if (
            distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) <
            ship.r + roids[i].r
          ) {
            explodeShip();
            destroyAsteroid(i);
            break;
          }
        }
      }

      // rotating ship
      ship.a += ship.rot;

      // moving ship
      ship.x += ship.thrust.x;
      ship.y += ship.thrust.y;
    } else {
      ship.explodeTime--;

      if (ship.explodeTime === 0) {
        lives--;
        if (lives === 0) {
          gameOver();
        } else {
          ship = newShip();
        }
      }
    }

    // after flying outwards of canvas ship will be appear on the opposite side of canvas
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

    // move lasers
    for (let i = ship.lasers.length - 1; i >= 0; i--) {
      // check travelled distance of laser shot
      if (ship.lasers[i].dist > LASER_DIST * canv.width) {
        ship.lasers.splice(i, 1);
        continue;
      }

      // handle explosion
      if (ship.lasers[i].explodeTime > 0) {
        ship.lasers[i].explodeTime--;

        // destroy the laser
        if (ship.lasers[i].explodeTime === 0) {
          ship.lasers.splice(i, 1);
          continue;
        }
      } else {
        // move laser shot
        ship.lasers[i].x += ship.lasers[i].xv;
        ship.lasers[i].y += ship.lasers[i].yv;

        // calculating the distance travelled by laser shot
        ship.lasers[i].dist += Math.sqrt(
          Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2)
        );
      }

      // handle flying laser shots over edges of screen
      if (ship.lasers[i].x < 0) {
        ship.lasers[i].x = canv.width;
      } else if (ship.lasers[i].x > canv.width) {
        ship.lasers[i].x = 0;
      }
      if (ship.lasers[i].y < 0) {
        ship.lasers[i].y = canv.height;
      } else if (ship.lasers[i].y > canv.height) {
        ship.lasers[i].y = 0;
      }
    }

    // move the asteroid
    for (let i = 0; i < roids.length; i++) {
      roids[i].x += roids[i].xv;
      roids[i].y += roids[i].yv;
      // handle edge of screen
      if (roids[i].x < 0 - roids[i].r) {
        roids[i].x = canv.width + roids[i].r;
      } else if (roids[i].x > canv.width + roids[i].r) {
        roids[i].x = 0 - roids[i].r;
      }

      if (roids[i].y < 0 - roids[i].r) {
        roids[i].y = canv.height + roids[i].r;
      } else if (roids[i].y > canv.height + roids[i].r) {
        roids[i].y = 0 - roids[i].r;
      }
    }
  }
});
