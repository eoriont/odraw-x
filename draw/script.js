class ODraw {
  constructor() {
    this.brushSize = 2;
    this.color = "#FFFFFF"

    this.mouseDown = false;
    this.mousePos = new Point(0, 0);
    this.lastMousePos = new Point(0, 0);
    this.lastMouseDown = new Point(0, 0);

    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");

    this.userMoves = {};
    this.moveIdsList = [];
    this.currentMove = {};

    this.allMoves = {};

    this.undoMoves = {};
    this.undoMoveIdsList = [];

    this.canvasId = getUrlVars()["id"];

    this.newChanges = {};

    document.addEventListener("DOMContentLoaded", this.documentReady.bind(this));
  }

  anyMove() {
    this.drawMoves();

    if (toolSelected == "pencil") {
      this.pencilMove();
    }

    if (toolSelected == "line") {
      this.lineMove();
    }

    if (toolSelected == "eraser") {
      this.eraserMove();
    }

    if (toolSelected == "colorpick") {
      this.colorPick();
    }
    
  }

  lineMove() {
    if (this.mouseDown) {
      if (Object.keys(this.currentMove).length == 0) {
        let id = genId();
        this.moveIdsList.push(id);
        this.currentMove = {
          mode: "line",
          color: this.color,
          brushSize: this.brushSize,
          id,
          userId,
          sessionId,
          data: [this.lastMouseDown, this.mousePos]
        }
      } else {
        this.currentMove.data[1] = this.mousePos;
      }
      this.writeMoves(this.currentMove);
    }
  }

  pencilMove() {
    if (this.mouseDown) {
      if (Object.keys(this.currentMove).length == 0) {
        let id = genId();
        this.moveIdsList.push(id);
        this.currentMove = {
          mode: "pencil",
          color: this.color,
          brushSize: this.brushSize,
          id,
          userId,
          sessionId,
          data: [this.lastMousePos, this.mousePos]
        }
      } else {
        this.currentMove.data.push(this.mousePos);
      }
      this.writeMoves(this.currentMove);
    }
  }

  eraserMove() {
    if (this.mouseDown) {
      if (Object.keys(this.currentMove).length == 0) {
        let id = genId();
        this.moveIdsList.push(id);
        this.currentMove = {
          mode: "pencil",
          color: this.canvas.style["background-color"],
          brushSize: this.brushSize,
          id,
          userId,
          sessionId,
          data: [this.lastMousePos, this.mousePos]
        }
      } else {
        this.currentMove.data.push(this.mousePos);
      }
      this.writeMoves(this.currentMove);
    }
  }

  colorPick() {
    if (this.mouseDown) {
      var pixelData = this.ctx.getImageData(this.mousePos.x, this.mousePos.y, 1, 1).data;
      this.color = RGBToHex(pixelData[0], pixelData[1], pixelData[2]);
      console.log(this.color)
      updateColor(this.color);
    }
  }

  drawMoves() {
    this.ctx.clearRect(0, 0, windowDimensions().x, windowDimensions().y);
    Object.values(this.allMoves)
      .filter(i => i.sessionId != sessionId)
      .concat(Object.values(this.userMoves))
      .forEach(move => {
        if (move.mode == "pencil") {
          this.drawLine(move);
        } else if (move.mode == "line") {
          this.drawLine(move);
        }
      });
  }

  drawLine(line) {
    this.ctx.beginPath();
    this.ctx.moveTo(line.data[0].x, line.data[0].y);
    this.ctx.lineWidth = line.brushSize;
    this.ctx.strokeStyle = line.color;
    this.ctx.lineJoin = this.ctx.lineCap = 'round';
    this.ctx.globalCompositeOperation = "source-over";
    for (let i = 1; i < line.data.length; i++) {
      let l = line.data[i];
      this.ctx.lineTo(l.x, l.y);
    }
    this.ctx.stroke();
  }

  writeMoves(move) {
    this.userMoves[move.id] = move;
    this.newChanges[move.id] = move
  }

  undo() {
    if (this.moveIdsList.length == 0) return;

    let undoMoveId = this.moveIdsList.pop();
    let undoMove = this.userMoves[undoMoveId];

    this.undoMoveIdsList.push(undoMoveId);
    this.undoMoves[undoMoveId] = undoMove;

    delete this.userMoves[undoMoveId];

    undoDB.call(this, undoMove);

    this.drawMoves();
  }

  redo() {
    if (this.undoMoveIdsList.length == 0) return;

    var oldMoveId = this.undoMoveIdsList.pop();
    var oldMove = this.undoMoves[oldMoveId];

    this.moveIdsList.push(oldMoveId);
    this.userMoves[oldMoveId] = oldMove;

    delete this.undoMoves[oldMoveId];

    redoDB.call(this, oldMove);

    this.drawMoves()
  }

  documentReady() {
    this.canvas.width = windowDimensions().x;
    this.canvas.height = windowDimensions().y;
    this.canvas.style["background-color"] = "#000000"
    document.getElementById("main").appendChild(this.canvas)
    document.title = "ODraw: " + this.canvasId;
    this.addEvents();
    watcher.call(this);
    writeToDb.call(this);
  }

  addEvents() {
    this.canvas.onmouseup = this.mouseUp.bind(this);
    document.onkeydown = this.keyDown.bind(this);
    this.canvas.onmousemove = this.mouseMove.bind(this);
    this.canvas.onmousedown = this.mouseDownF.bind(this);
    this.canvas.onwheel = this.mouseWheel.bind(this);
    window.onresize = this.windowResize.bind(this);
  }

  mouseUp() {
    this.mouseDown = false;
    this.currentMove = {};
  }

  keyDown(e) {
    let key = e.code
    let metaKey = e.ctrlKey || e.metaKey;
    if (metaKey && key != "KeyR") {
      e.preventDefault();
    }
    if (key == "KeyZ" && metaKey) {
      this.undo();
    } else if (key == "KeyY" && metaKey) {
      this.redo();
    }

    if(key == "KeyH") {
      toggleNav();
    }

    if(key == "KeyC") {
      this.userMoves = {};
      this.moveIdsList = [];
      clearMovesDB();
      this.ctx.clearRect(0, 0, windowDimensions().x, windowDimensions().y);
    }
  }

  mouseMove(e) {
    var rect = this.canvas.getBoundingClientRect();
    this.lastMousePos = this.mousePos;
    this.mousePos = new Point(e.clientX - rect.left, e.clientY - rect.top);
    this.anyMove();
  }

  mouseDownF() {
    this.mouseDown = true;
    this.lastMouseDown = this.mousePos;
    this.anyMove();
  }

  mouseWheel(e) {
    if (e.deltaY >= 1) this.brushSize+=.1;
    else if (e.deltaY <= -1) this.brushSize-=.1;
    this.ctx.lineWidth = this.brushSize;
    document.getElementById("brushSize").value = this.brushSize;
  }

  windowResize() {
    this.canvas.width = windowDimensions().x;
    this.canvas.height = windowDimensions().y;
  }
}

var ocanvas = new ODraw();
