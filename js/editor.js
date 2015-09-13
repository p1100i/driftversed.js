var
  canvas,

  getCoords = function getCoords(currentElement, event) {
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;

    totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
    totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {
      x:event.layerX,
      y:event.layerY
    };

    // return {
    //   x:canvasX,
    //   y:canvasY
    // };
  },

  exportLevel = function exportLevel() {
    var
      i,
      j,
      index,
      object,
      borders = [],
      stringified = '';

    for (i = 0; i < multiObjects.length; i++) {
      object = multiObjects[i][0];

      if (object.t === 'b') {
        index = getBorderIndex(object);
        borders[index] = 1;
      }
    }

    for (i = -FIELD_OFFSET; i < FIELD_HEIGHT + FIELD_OFFSET; i++) {
      for (j = -FIELD_OFFSET; j < FIELD_WIDTH + FIELD_OFFSET; j++) {
        if (i < 0 || i >= FIELD_HEIGHT || j < 0 || j >= FIELD_WIDTH) {
          stringified += '2';
        } else {
          index = (i + FIELD_OFFSET) * FIELD_WIDTH_W_O + j + FIELD_OFFSET;
          stringified += borders[index] ? '1' : '0';
        }
      }
    }

    return stringified;
  },

  onCanvasClick = function onCanvasClick(e) {
    var coords = getCoords(canvas, e);

    coords.x = roundToCenter(coords.x);
    coords.y = roundToCenter(coords.y);

    createBorder(coords.x, coords.y);
    console.log('clicked on coord', coords);
  },

  edit = function edit() {
    canvas = canvasObjects[0].e;

    canvas.onclick = onCanvasClick;
  };




setTimeout(edit, 200);
