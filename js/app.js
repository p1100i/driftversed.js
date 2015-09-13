var
  CANVAS_WIDTH          = 420,
  CANVAS_HEIGHT         = 300,
  E_S                   = 30,
  HALF_E_S              = E_S  / 2,
  FIELD_WIDTH           = CANVAS_WIDTH  / E_S,
  FIELD_HEIGHT          = CANVAS_HEIGHT / E_S,
  F_OFF                 = 2,
  F_WIDTH_W_O           = FIELD_WIDTH  + 2 * F_OFF,
  FIELD_HEIGHT_W_O      = FIELD_HEIGHT + 2 * F_OFF,
  WALL_DAMAGE           = 5,
  PLAYER_FRICTION       = 25,
  SMOKE_MULTI           = 100,
  ONE_POINT_TWO         = 1.015,
  ASSET_NAMES           = ['s', 'h'],
  C_TICK                = 5,

  QUOTES = [
    'Clear skies with a chance of satellite debris.',
    'No, no, no, Houston, don\'t be anxious. Anxiety is bad for the heart.',
    'I hate space!',
    'So, what do you like about being up here?<br><br> The silence.',
    'Houston, I have a bad feeling about this mission.'
  ],

  LEVELS = [
    [
      // lobby
      [210, 100],
      [210, 240],
      '222222222222222222222222222222222222221111111111111122221111100001111122221110000000011122221100000000001122221100000000001122221100000000001122221110000000011122221110000000011122221111110011111122221111111111111122222222222222222222222222222222222222',
      1
    ],
    [
      // easy
      [80, 80],
      [375, 255],
      '222222222222222222222222222222222222221111000000111122221000000000000122221000000000000122221000000000000122221000000000000122221000000001000122221000000001000122221000000001100122221000000001000122221111000001111122222222222222222222222222222222222222'
    ],
    [
      // mid
      [45, 45],
      [315, 225],
      '222222222222222222222222222222222222221111011111111122221001011111000122221001010100000122221001010100000022221000000000000022221000000000110122221011100000000122221001001110010122221000001110010122221111111111111122222222222222222222222222222222222222'
    ],
    [
      // hard
      [45, 45],
      [375, 135],
      '222222222222222222222222222222222222221110111100011122221010001000000122221011000010000122221000000110000022220000000100010022221110110000111022220000000100010022220000100100000022220000101101000022220000100001000022222222222222222222222222222222222222'
    ]
  ],

  level,
  interval,
  timeOut,
  levelCompleted,
  playerMulti,
  goalMulti,
  canvasHolder,
  hpHolder,
  storyHolder,
  lastUpdateTimestamp = 0,

  assetsToLoad  = ASSET_NAMES.length,
  keys          = {},
  imgs          = {},
  playerActions = {},
  multiObjects  = [],
  borders       = {},
  canvasIds     = [],
  canvasObjects = [],
  keyHandlers   = {},
  tables        = {},

  removeFromArray = function removeFromArray(array, index) {
    if (index < 0 || index >= array.length)  {
      return;
    }

    array.splice(index, 1);
  },

  roundToCenter = function roundToCenter(number) {
    return Math.floor(number / E_S) * E_S + HALF_E_S;
  },

  removeObject = function removeObject(object) {
    if (object.t === 'b') {
      removeBorder(object);
    }
  },

  removeMultiObject = function removeMultiObject(multiObject, index) {
    multiObject.forEach(removeObject);

    removeFromArray(multiObjects, index);
  },

  removeBorder = function removeBorder(border) {
    var canvasId = border.co.i;

    delete borders[canvasId][getBorderKey(border)];
    delete borders[canvasId][getBorderIndex(border)];
  },


  clearLevel = function clearLevel() {
    while (multiObjects.length) {
      removeMultiObject(multiObjects[0], 0);
    }
  },

  importLevel = function importLevel(stringified) {
    var
      i,
      x,
      y,
      coordinates,
      bordersString = stringified.split('');

    clearLevel();

    for (i = 0; i < bordersString.length; i++) {
      coordinates = getBorderCoordinatesByIndex(i);
      x           = roundToCenter(coordinates[0]);
      y           = roundToCenter(coordinates[1]);

      if (bordersString[i] !== '0') {
        createBorder(x, y);
      }
    }
  },

  getBorderIndex = function getBorderIndex(object) {
    return (Math.floor(object.y / E_S) + F_OFF) * F_WIDTH_W_O + Math.floor(object.x / E_S) + F_OFF;
  },

  getBorderCoordinatesByIndex = function getBorderCoordinatesByIndex(index) {
    return [
      (index % F_WIDTH_W_O - F_OFF) * E_S,
      (Math.floor(index / F_WIDTH_W_O) - F_OFF) * E_S
    ];
  },

  getBorderCoordinates = function getBorderCoordinates(object) {
    var
      index = getBorderIndex(object);

    return getBorderCoordinatesByIndex(index);
  },

  getBorderKey = function getBorderKey(object) {
    var
      coordinates = getBorderCoordinates(object);

    return getBorderKeyByCoordinates(coordinates);
  },

  getBorderKeyByCoordinates = function getBorderKeyByCoordinates(coordinates) {
    return coordinates[0] + '_' + coordinates[1];
  },

  getIndexNeighbors = function getIndexNeighbors(i) {
    var
      t = i - F_WIDTH_W_O,
      b = i + F_WIDTH_W_O;

    return [
      t - 1, t, t + 1,
      i - 1, i, i + 1,
      b - 1, b, b + 1
    ];
  },

  calculateCollidables = function calculateCollidables(object) {
    var
      border,
      borderIndex = getBorderIndex(object),
      indexes     = getIndexNeighbors(borderIndex),
      i           = indexes.length;

    object.c = [];

    while (i--) {
      border = borders[object.co.i][indexes[i]];

      if (border) {
        object.c.push(border);
      }
    }
  },


  toggleAction = function toggleAction(object, fn, stop, priority) {
    var
      i,
      j,
      actions,
      allActions = object.aa;

    for (i = 0; i <= priority; i++) {
      if (!object.a[i]) {
        object.a[i] = [];
      }
    }

    actions = object.a[priority];
    i       = actions.indexOf(fn);

    if (stop) {
      j = allActions.indexOf(fn);
      removeFromArray(allActions, j);

      j = allActions.indexOf(fn);
      if (j < 0) {
        removeFromArray(actions, i);
      }

      return;
    }

    object.aa.push(fn);

    if(i < 0) {
      actions.push(fn);
    }
  },

  toggleMultiAction = function toggleMultiAction(objectMulti, fn, stop, priority) {
    if (!objectMulti) {
      return;
    }

    var
      object,
      k = objectMulti.length;

    while (k--) {
      object = objectMulti[k];
      toggleAction(object, fn, stop, priority);
    }
  },

  addMultiObject = function addMultiObject(object) {
    multiObjects.push(object);
  },

  updateObjectDimensions = function updateObjectDimensions(object) {
    object.w2 = object.w / 2;
    object.h2 = object.h / 2;
  },

  updateObjectVBox = function updateObjectVBox(object) {
    object.vxt = object.vx - object.w2;
    object.vyt = object.vy - object.h2;
    object.vxb = object.vx + object.w2;
    object.vyb = object.vy + object.h2;
  },

  updateVirtualPosition = function updateVirtualPosition(object) {
    object.vx = object.x + object.dx;
    object.vy = object.y + object.dy;

    updateObjectVBox(object);
  },

  updateObjectBox = function updateObjectBox(object) {
    object.xt = object.x - object.w2;
    object.yt = object.y - object.h2;
    object.xb = object.x + object.w2;
    object.yb = object.y + object.h2;
  },

  updatePosition = function updatePosition(object) {
    object.x = object.vx;
    object.y = object.vy;

    updateObjectBox(object);
  },

  updateSpeed = function updateSpeed (object) {
    object.dx += object.ddx;
    object.dy += object.ddy;
  },

  collidedFromLeft = function collidedFromLeft(object, collider) {
    return object.xb < collider.xt && object.vxb >= collider.xt;
  },

  collidedFromTop = function collidedFromTop(object, collider) {
    return object.yb < collider.yt && object.vyb >= collider.yt;
  },

  collidedFromRight = function collidedFromRight(object, collider) {
    return object.xt >= collider.xb && object.vxt < collider.xb;
  },

  collidedFromBottom = function collidedFromBottom(object, collider) {
    return object.yt >= collider.yb && object.vyt < collider.yb;
  },

  isColliding = function isColliding(object, collidable) {
    return (
      object.vxt < collidable.xb &&
      object.vxb > collidable.xt &&
      object.vyt < collidable.yb &&
      object.vyb > collidable.yt
    );
  },

  getCollider = function getCollider(object) {
    var
      collidable,
      i = object.c.length;

    while (i--) {
      collidable = object.c[i];

      if (isColliding(object, collidable)) {
        return collidable;
      }
    }

    return false;
  },

  getSpeedStrength = function getSpeedStrength(object) {
    return Math.sqrt(Math.pow(object.dx, 2) + Math.pow(object.dy, 2));
  },

  updateCollisions = function updateCollisions(object) {
    var
      collider;

    object.cc++;

    if (object.cc === C_TICK) {
      calculateCollidables(object);
      object.cc = 0;
    }

    collider = getCollider(object);

    if (collider) {
      if (collidedFromTop(object, collider) || collidedFromBottom(object, collider)) {
        object.vy = object.y;
        object.dy *= -1;
      } else {
        object.vx = object.x;
        object.dx *= -1;
      }

      object.hp -= getSpeedStrength(object) * WALL_DAMAGE;
      object.dx /= ONE_POINT_TWO;
      object.dy /= ONE_POINT_TWO;
    }
  },

  updateDeprecation = function updateDeprecation(object) {
    object.ddx /= PLAYER_FRICTION;
    object.ddy /= PLAYER_FRICTION;

    object.dx  /= ONE_POINT_TWO;
    object.dy  /= ONE_POINT_TWO;
  },

  toggleBaseAction = function toggleBaseAction(object, fn, stop) {
    toggleAction(object, fn, stop, 2);
  },

  toggleUpdatePositionAction = function toggleUpdatePositionAction(object, collidable, stop) {
    toggleBaseAction(object, updateSpeed, stop);
    toggleBaseAction(object, updateVirtualPosition, stop);

    if (collidable) {
      toggleBaseAction(object, updateCollisions, stop);
    }

    toggleBaseAction(object, updateDeprecation, stop);
    toggleBaseAction(object, updatePosition, stop);
  },

  command = function command(fn, stop, e) {
    toggleMultiAction(playerMulti, fn, stop, 1);
    toggleMultiAction(playerMulti, createSmoke, stop, 3);
  },

  fading = function fading(object) {
    object.o -= 0.01;
    object.ro += Math.floor(Math.random() * 10) / 100;

    if (object.o < 0) {
      object.o = 0;
    }

    object.w += 0.2;
    object.h += 0.2;
    updateObjectDimensions(object);
  },

  createBorder = function createBorder(x, y) {
    var
      border,
      canvasBorder,
      canvasId,
      borderMulti = createMultiObject([
        'b',
        x,
        y,
        E_S - 6,
        E_S - 6,
        1,
        0
      ]),
      l = borderMulti.length;

    while (l--) {
      border    = borderMulti[l];
      canvasId  = border.co.i;

      if (!borders[canvasId]) {
        borders[canvasId] = {};
      }

      canvasBorder = borders[canvasId];
      canvasBorder[getBorderKey(border)] = canvasBorder[getBorderIndex(border)] = border;
    }

    addMultiObject(borderMulti);
  },

  createSmoke = function createSmoke(actor) {
    var
      smoke = createObject([
        's',
        actor.x,
        actor.y,
        2,
        2,
        1,
        0,
        -actor.ddx * SMOKE_MULTI,
        -actor.ddy * SMOKE_MULTI,
        1,
        '200,200,210'
      ], actor.co);

    toggleUpdatePositionAction(smoke);
    toggleAction(smoke, fading, 0, 0);
    addMultiObject([smoke]);
  },

  navigate = function navigate(ddx, ddy, object, diff) {
    object.ddx += (ddx / PLAYER_FRICTION) * object.co.r;
    object.ddy += (ddy / PLAYER_FRICTION) * object.co.r;
  },

  onKey = function onKey(handlerCode, e) {
    var
      k,
      handler;

    e = e       || window.event;
    k = e.which || e.keyCode;

    if (keys[k] === handlerCode) {
      return;
    }

    keys[k] = handlerCode;
    handler = keyHandlers[handlerCode][k];

    if (handler) {
      handler(k);
    }
  },

  drawObject = function drawObject(object) {
    var
      i,
      j,
      ctx;

    ctx = object.co.c;
    ctx.save();

    ctx.translate(object.x, object.y);
    ctx.rotate(object.ro);

    if (object.i) {
      ctx.globalAlpha = object.o;
      ctx.drawImage(object.i, -object.w2, -object.h2);
    }

    if (object.r) {
      i = object.r;
      j = 2*i;

      ctx.beginPath();
      ctx.rect(-object.w2 + i, -object.h2 + i, object.w - j, object.h - j);
      ctx.strokeStyle='rgba(' + object.rc + ',' + object.o + ')';
      ctx.stroke();
      ctx.closePath();
    }

    ctx.restore();
  },

  updateObject = function updateObject(diff, object) {
    var
      k,
      array,
      j = 0;

    for (j = 0; j < object.a.length; j++) {
      if (object.s && j !== 0) {
        break;
      }

      array = object.a[j];

      for (k = 0; k < array.length; k++) {
        array[k](object, diff);
      }
    }

    drawObject(object);
  },

  updateObjectMulti = function updateObjectMulti(diff, objectMulti) {
    var
      object,
      l = objectMulti.length;

    while (l--) {
      object = objectMulti[l];
      updateObject(diff, object);
    }
  },

  updateCanvas = function updateCanvas(diff, canvasObject) {
    canvasObject.c.clearRect(0, 0, canvasObject.e.width, canvasObject.e.height);
  },

  update = function update(timestamp) {
    // diff will be around 16
    var
      i,
      diff = Math.abs(lastUpdateTimestamp - timestamp);

    canvasObjects.forEach(updateCanvas.bind(0, diff));

    i = multiObjects.length;

    while (i--) {
      updateObjectMulti(diff, multiObjects[i]);
    }

    lastUpdateTimestamp = timestamp;

    if (levelCompleted) {
      // TODO make pretty anim
      if (timeOut) {
        return;
      }

      if (levelCompleted > 0) {
        timeOut = window.setTimeout(function () {
          window.clearInterval(interval);
          run(1);
          timeOut = null;
        }, 2000);
      } else {
        timeOut = window.setTimeout(function () {
          window.clearInterval(interval);
          run(0);
          timeOut = null;
        }, 2000);
      }

      return;
    }
  },

  createObject = function createObject(params, canvasObject) {
    var
      object = {
        t     : params[0],      //  type
        x     : params[1],      //  x
        y     : params[2],      //  y
        w     : params[3],      //  width
        h     : params[4],      //  height
        r     : params[5],      //  rect - by having the margin value
        i     : params[6],      //  image
        dx    : params[7]  || 0, //  speed on x
        dy    : params[8]  || 0, //  speed on y
        hp    : params[9]  || 1, //  HP
        rc    : params[10] || '80,90,80',
        ro    : 0,              //  rotation
        ddx   : 0,              //  acceleration on x
        ddy   : 0,              //  acceleration on y
        o     : 1,              //  opacity
        a     : [],             //  action
        aa    : [],             //  action-registry
        c     : [],             //  collidables
        cc    : 0,              //  collilision-update-counter
        co    : canvasObject    //  canvas object reference
        // xt                       x-top
        // yt                       y-top
      };

    updateObjectDimensions(object);

    updateObjectBox(object);

    return object;
  },

  createMultiObject = function createMultiObject(params) {
    var
      multiObject   = [],
      i             = canvasObjects.length,
      object,
      canvasObject;

    while (i--) {
      canvasObject  = canvasObjects[i];
      object        = createObject(params, canvasObject);

      multiObject.push(object);
    }

    return multiObject;
  },

  selectSameObject = function selectSameObject(multiObject, targetObject) {
    var
      object,
      i = multiObject.length;

    while (i--) {
      object = multiObject[i];

      if (object.co === targetObject.co) {
        return object;
      }
    }
  },

  setCurrentLevelCompleted = function setCurrentLevelCompleted(value) {
    levelCompleted = value;
  },

  isLevelCompleted = function isLevelCompleted() {
    var
      i = canvasObjects.length;

    while (i--) {
      if (!canvasObjects[i].w) {
        return false;
      }
    }

    return true;
  },

  stop = function stop(player) {
    player.s = 1;
    toggleUpdatePositionAction(player, 1, 1);
    toggleAction(player, fading, 0, 0);
  },

  isCanvasLevelCompleted = function isCanvasLevelCompleted(goalObject) {
    var
      player = selectSameObject(playerMulti, goalObject);

    if (isColliding(player, goalObject)) {
      // toggleAction(goalObject, isCanvasLevelCompleted, 1, 0);
      player.co.w   = true;
      goalObject.ro += 0.1;
    } else {
      player.co.w = false;
    }

    if (isLevelCompleted()) {
      stop(player);
      setCurrentLevelCompleted(1);
    }
  },

  updateHp = function updateHp(player) {
    player.co.h.width = (player.hp < 0 ? 0 : player.hp) + '%';

    if (player.hp <= 0) {
      stop(player);
      setCurrentLevelCompleted(-1);
    }
  },

  restartLevel = function restartLevel(player) {
    stop(player);
    setCurrentLevelCompleted(-1);
  },

  populate = function populate() {
    var
      i,
      goalInfo   = level[1];
      playerInfo = level[0];

    importLevel(level[2]);

    playerMulti = createMultiObject([
      'p',
      playerInfo[0],
      playerInfo[1],
      E_S,
      E_S,
      0,
      imgs.s,
      0,
      0,
      100
    ]);

    goalMulti = createMultiObject([
      'g',
      goalInfo[0],
      goalInfo[1],
      E_S,
      E_S,
      0,
      imgs.h
    ]);

    toggleMultiAction(goalMulti, isCanvasLevelCompleted, 0, 0);

    i = playerMulti.length;

    while (i--) {
      toggleUpdatePositionAction(playerMulti[i], 1);
    }

    toggleMultiAction(playerMulti, updateHp, 0, 0);

    addMultiObject(playerMulti);
    addMultiObject(goalMulti);
  },

  handleKeys = function handleKeys(keyHandlers, keyCodes, fn, stop) {
    var
      code,
      i = keyCodes.length;

    while (i--) {
      code = keyCodes[i];
      keyHandlers[code] = command.bind(0, fn, stop);
    }
  },

  bindKeyHandlers = function bindKeyHandlers() {
    var object;

    playerActions.left   = navigate.bind(0, -1,  0);
    playerActions.up     = navigate.bind(0,  0, -1);
    playerActions.right  = navigate.bind(0,  1,  0);
    playerActions.down   = navigate.bind(0,  0,  1);

    object = keyHandlers.down = {};
    handleKeys(object, ['65','37'], playerActions.left,  0);
    handleKeys(object, ['87','38'], playerActions.up,    0);
    handleKeys(object, ['68','39'], playerActions.right, 0);
    handleKeys(object, ['83','40'], playerActions.down,  0);
    handleKeys(object, ['82'], restartLevel,  0);

    object = keyHandlers.up = {};
    handleKeys(object, ['65','37'], playerActions.left,  1);
    handleKeys(object, ['87','38'], playerActions.up,    1);
    handleKeys(object, ['68','39'], playerActions.right, 1);
    handleKeys(object, ['83','40'], playerActions.down,  1);
    handleKeys(object, ['82'], restartLevel,  1);

    document.onkeydown  = onKey.bind(0, 'down');
    document.onkeyup    = onKey.bind(0, 'up');
  },

  emptyCanvasHTML = function emptyCanvasHTML() {
    canvasIds = [];
    canvasHolder.innerHTML = hpHolder.innerHTML = '';
  },

  isFirstLevel = function isFirstLevel() {
    return level === LEVELS[0];
  },

  run = function run(goNextLevel) {
    var
      i;

    emptyCanvasHTML();

    if (goNextLevel) {
      increaseLevel();

      if (!level) {
        // OVER
        credits();
        return;
      }
    }

    if (!isFirstLevel()) {
      hideInfo();
    }

    setCurrentLevelCompleted(0);

    for (i = 0; i < (level[3] || 2); i++) {
      canvasIds.push('c_' + i);
    }

    canvasIds.forEach(setupCanvasObject);

    populate();

    interval = setInterval(update, 18);
  },

  setupCanvasObject = function setupCanvasObject(id, i) {
    var
      hpBarElement,
      hpElement,
      canvasElement;

    canvasElement           = document.createElement('canvas');
    canvasElement.width    = CANVAS_WIDTH;
    canvasElement.height   = CANVAS_HEIGHT;
    canvasHolder.appendChild(canvasElement);

    hpBarElement              = document.createElement('div');
    hpBarElement.className  = 'w';
    hpHolder.appendChild(hpBarElement);

    hpElement                 = document.createElement('div');
    hpElement.className     = 'h';
    hpBarElement.appendChild(hpElement);

    canvasObjects.push({
      'i' : id,
      'h' : hpElement.style,
      'e' : canvasElement,
      'c' : canvasElement.getContext('2d'),
      'r' : i % 2 ? -1 : 1
    });
  },

  onAssetLoaded = function onAssetLoaded(fileName, e) {
    imgs[fileName] = e.target;

    assetsToLoad--;

    if (!assetsToLoad) {
      run();
    }
  },

  loadAsset = function loadAsset(fileName) {
    var img;

    img         = new Image();
    img.onload  = onAssetLoaded.bind(0, fileName);
    img.src     = fileName;
  },

  getNextLevelInfo = function getNextLevelInfo() {
    var
      nextLevel,
      nextLevelIndex,
      nextLevelInfo = [];

    if (!level) {
      nextLevelIndex = 0;
    } else if (isFirstLevel()){
      nextLevelIndex  = document.cookie;
      nextLevel       = LEVELS[nextLevelIndex];

      if (!nextLevel || nextLevel === LEVELS[0]) {
        nextLevelIndex = 1;
      }

      nextLevelInfo.unshift(nextLevelIndex);
    } else {
      nextLevelIndex = LEVELS.indexOf(level) + 1;
      nextLevelInfo.unshift(nextLevelIndex);
    }

    nextLevelInfo.unshift(LEVELS[nextLevelIndex]);

    return nextLevelInfo;
  },

  increaseLevel = function increaseLevel() {
    var nextLevelInfo = getNextLevelInfo();

    if (nextLevelInfo[1]) {
      document.cookie = nextLevelInfo[1];
    }

    level = nextLevelInfo[0];
  },

  hideInfo = function hideInfo() {
    storyHolder.style.display = 'none';
    tables.l.className = tables.r.className = '';
    tables.l.innerHTML = tables.r.innerHTML = '';
  },

  credits = function credits() {
    tables.m.innerHTML = 'Good job, you can join US now!<br><img src="n" width="500px" height="400px">';
  },

  init = function init() {
    var
      length  = QUOTES.length,
      index   = Math.floor(Math.random() * length),
      quote   = QUOTES[index];

    canvasHolder  = document.getElementById('c');
    hpHolder      = document.getElementById('h');
    storyHolder   = document.getElementById('i');
    storyHolder.innerHTML = '"' + quote + '" - <a href="http://www.imdb.com/title/tt1454468/" target="_blank">Gravity</a>';
    tables.l = document.getElementById('left');
    tables.m = document.getElementById('mid');
    tables.r = document.getElementById('right');

    increaseLevel();

    bindKeyHandlers();

    ASSET_NAMES.forEach(loadAsset);
  };

window.onload = init;
window.cheat  = setCurrentLevelCompleted;
