import * as PIXI from "./pixi.mjs";

let MODE = null;

const checkboxes = document.querySelector(".menu__type");
const buttons = document.querySelector(".menu__buttons");
const playButton = document.querySelector("#play");
const stopButton = document.querySelector("#stop");
const menuButton = document.querySelector("#menu");

menuButton.style.display = "none";

const handleSelectTypeGame = (event) => {
  const target = event.target;

  if (target.tagName === "INPUT" && target.type === "checkbox") {
    const allCheckboxes = checkboxes.querySelectorAll('input[type="checkbox"]');
    allCheckboxes.forEach((checkbox) => (checkbox.checked = false));

    target.checked = true;
    MODE = target.dataset.type;
  }
};

const startSnakeGame = () => {
  return new SnakeGame({
    numberOfLines: 20,
    numberOfCellsPerLine: 20,
    snakeLength: 3,
    cellsPerSecond: 2,
    mode: MODE,
  });
};

const handleStartGame = () => {
  if (MODE === null) return;

  toggleMenuVisibility(false);

  startSnakeGame();
};

const handleStopGame = () => {
  const canvas = document.querySelector("canvas");
  if (canvas) canvas.remove();

  document.querySelector(".store__count").innerText = 0;
  document.querySelector(".best__count").innerText = 0;

  toggleMenuVisibility(true);
};

const toggleMenuVisibility = (showMenu) => {
  if (showMenu) {
    menuButton.style.display = "none";
    playButton.style.display = "block";
    stopButton.style.display = "block";
    checkboxes.style.display = "block";
    buttons.style.margin = "auto";
  } else {
    menuButton.style.display = "block";
    playButton.style.display = "none";
    stopButton.style.display = "none";
    checkboxes.style.display = "none";
    buttons.style.marginBottom = "20px";
  }
};

checkboxes.addEventListener("click", handleSelectTypeGame);
playButton.addEventListener("click", handleStartGame);
menuButton.addEventListener("click", handleStopGame);

class SnakeGame {
  constructor(options) {
    this.numberOfLines = options.numberOfLines || 8;
    this.numberOfCellsPerLine = options.numberOfCellsPerLine || 16;
    this.snakeLength = options.snakeLength || 2;
    this.cellsPerSecond = options.cellsPerSecond || 1;
    this.second = 1000 / this.cellsPerSecond;
    this.currentSpeed = this.cellsPerSecond;
    this.bodySnakePosition = this.buildBodyForSnake(this.snakeLength);
    this.foodPositions = [];
    this.lastSnakePath = [0, -1];
    this.snakeIsAlive = true;
    this.mode = options.mode || "classic";
    this.walls = [];

    this.currentScore = 0;
    this.bestScore = localStorage.getItem("bestScore") || 0;

    this.init();
    this.bindEvents();
  }

  async init() {
    this.app = new PIXI.Application({
      width: this.numberOfCellsPerLine * 20,
      height: this.numberOfLines * 20,
      backgroundColor: 0x1099bb,
    });

    document.querySelector(".snake").appendChild(this.app.view);

    this.drawField();
    this.paintSnakeBody(this.bodySnakePosition);
    this.initUI();

    if (this.mode === "two_wals") {
      this.foodPositions = this.generateTwoFoodPositions(
        this.bodySnakePosition,
        this.walls
      );
      this.createFood(this.foodPositions[0]);
      this.createFood(this.foodPositions[1]);
    } else {
      this.foodPosition = this.generateFoodPosition(
        this.bodySnakePosition,
        this.walls
      );
      this.createFood(this.foodPosition);
    }

    this.timer = setInterval(() => this.tick(), this.second);
  }

  drawField() {
    this.gridContainer = new PIXI.Container();
    for (let i = 0; i < this.numberOfLines; i++) {
      for (let j = 0; j < this.numberOfCellsPerLine; j++) {
        const cell = new PIXI.Graphics();
        cell.lineStyle(0, 0x575757, 1);
        cell.drawRect(j * 20, i * 20, 20, 20);
        this.gridContainer.addChild(cell);
      }
    }
    this.app.stage.addChild(this.gridContainer);
  }

  bindEvents() {
    window.addEventListener("keydown", (e) => this.handlecChangeDirection(e));
  }

  handlecChangeDirection(e) {
    const keyCodeRightButton = 39;
    const keyCodeLeftButton = 37;
    const keyCodeUpButton = 38;
    const keyCodeDownButton = 40;

    switch (e.keyCode) {
      case keyCodeRightButton:
        this.lastSnakePath = [0, 1];
        break;
      case keyCodeLeftButton:
        this.lastSnakePath = [0, -1];
        break;
      case keyCodeUpButton:
        this.lastSnakePath = [-1, 0];
        break;
      case keyCodeDownButton:
        this.lastSnakePath = [1, 0];
        break;
    }
  }

  buildBodyForSnake(lengthBody) {
    const snakePosition = [
      [
        Math.floor(this.numberOfLines / 2),
        Math.floor(this.numberOfCellsPerLine / 2),
      ],
    ];
    for (let i = 1; i < lengthBody; i++) {
      const tailSegment = snakePosition[0].slice(0);
      tailSegment[1] += i;
      snakePosition.push(tailSegment);
    }
    return snakePosition;
  }

  paintSnakeBody(positionSnake) {
    if (!this.snakeContainer) {
      this.snakeContainer = new PIXI.Container();
      this.app.stage.addChild(this.snakeContainer);
    }
    this.snakeContainer.removeChildren();

    for (let i = 0; i < positionSnake.length; i++) {
      const segment = new PIXI.Graphics();
      segment.beginFill(0x00ff00);
      segment.drawRect(
        positionSnake[i][1] * 20,
        positionSnake[i][0] * 20,
        20,
        20
      );
      segment.endFill();
      this.snakeContainer.addChild(segment);
    }
  }

  tick() {
    if (!this.snakeIsAlive) return;

    const oldPositionSnake = this.bodySnakePosition.slice(0);
    const step = this.lastSnakePath;

    const headSnake = [
      this.bodySnakePosition[0][0] + step[0],
      this.bodySnakePosition[0][1] + step[1],
    ];

    if (this.mode === "noCube") {
      const [newRow, newCol] = [
        (headSnake[0] + this.numberOfLines) % this.numberOfLines,
        (headSnake[1] + this.numberOfCellsPerLine) % this.numberOfCellsPerLine,
      ];
      this.bodySnakePosition.unshift([newRow, newCol]);
      if (this.bodySnakePosition.length > this.snakeLength) {
        this.bodySnakePosition.pop();
      }
    } else {
      this.bodySnakePosition.unshift(headSnake);
      if (this.bodySnakePosition.length > this.snakeLength) {
        this.bodySnakePosition.pop();
      }
    }

    this.killSnake(oldPositionSnake);
    this.paintSnakeBody(this.bodySnakePosition);

    let foodEaten = false;

    if (this.mode === "two_wals") {
      if (
        this.foodPositions.some((pos) =>
          this.arraysEqual(this.bodySnakePosition[0], pos)
        )
      ) {
        foodEaten = true;
        this.updateScore();
        const eatenFoodIndex = this.foodPositions.findIndex((pos) =>
          this.arraysEqual(this.bodySnakePosition[0], pos)
        );
        const remainingFoodIndex = (eatenFoodIndex + 1) % 2;

        this.bodySnakePosition[0] = this.foodPositions[remainingFoodIndex];
        this.foodPositions = this.generateTwoFoodPositions(
          this.bodySnakePosition,
          this.walls
        );
        this.removeFood();
        this.createFood(this.foodPositions[0]);
        this.createFood(this.foodPositions[1]);
      }
    } else if (this.foodPosition) {
      if (this.arraysEqual(this.bodySnakePosition[0], this.foodPosition)) {
        foodEaten = true;
        this.updateScore();

        this.bodySnakePosition.push(this.foodPosition);
        this.removeFood();

        if (this.mode === "walls") {
          this.createWall();
        }

        this.foodPosition = this.generateFoodPosition(
          this.bodySnakePosition,
          this.walls
        );
        this.createFood(this.foodPosition);
      }
    }

    if (foodEaten && this.mode === "acceleration") {
      this.currentSpeed *= 1.1;
      this.second = 1000 / this.currentSpeed;
      clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), this.second);
    }
  }

  arraysEqual(firstArray, secondArray) {
    return firstArray.toString() === secondArray.toString();
  }

  generateFoodPosition(snakePosition, walls) {
    let position;
    let isValidPosition = false;

    while (!isValidPosition) {
      isValidPosition = true;
      position = [
        Math.floor(Math.random() * this.numberOfLines),
        Math.floor(Math.random() * this.numberOfCellsPerLine),
      ];

      for (let i = 0; i < snakePosition.length; i++) {
        if (this.arraysEqual(snakePosition[i], position)) {
          isValidPosition = false;
          break;
        }
      }

      for (let wall of walls) {
        if (this.arraysEqual(wall, position)) {
          isValidPosition = false;
          break;
        }
      }
    }
    return position;
  }

  generateTwoFoodPositions(snakePosition, walls) {
    let positions;
    let isValidPositions = false;

    while (!isValidPositions) {
      isValidPositions = true;
      positions = [
        this.generateFoodPosition(snakePosition, walls),
        this.generateFoodPosition(snakePosition, walls),
      ];

      if (this.arraysEqual(positions[0], positions[1])) {
        isValidPositions = false;
      }

      for (let pos of positions) {
        for (let i = 0; i < snakePosition.length; i++) {
          if (this.arraysEqual(snakePosition[i], pos)) {
            isValidPositions = false;
            break;
          }
        }

        for (let wall of walls) {
          if (this.arraysEqual(wall, pos)) {
            isValidPositions = false;
            break;
          }
        }

        if (!isValidPositions) break;
      }
    }
    return positions;
  }

  createFood(foodPosition) {
    if (!this.foodContainer) {
      this.foodContainer = new PIXI.Container();
      this.app.stage.addChild(this.foodContainer);
    }

    const food = new PIXI.Graphics();
    food.beginFill(0xf4f2f4);
    food.drawRect(foodPosition[1] * 20, foodPosition[0] * 20, 20, 20); // Нарисовать квадрат
    food.endFill();
    this.foodContainer.addChild(food);
  }

  removeFood() {
    if (this.foodContainer) {
      this.foodContainer.removeChildren();
    }
  }

  killSnake() {
    const snakeHead = this.bodySnakePosition[0];

    // Check if the snake has crashed into a wall or into itself
    for (let i = 1; i < this.bodySnakePosition.length; i++) {
      if (this.arraysEqual(snakeHead, this.bodySnakePosition[i])) {
        this.snakeIsAlive = false;
      }
    }

    if (
      snakeHead[0] >= this.numberOfLines ||
      snakeHead[0] < 0 ||
      snakeHead[1] >= this.numberOfCellsPerLine ||
      snakeHead[1] < 0
    ) {
      this.snakeIsAlive = false;
    }

    for (let wall of this.walls) {
      if (this.arraysEqual(snakeHead, wall)) {
        this.snakeIsAlive = false;
      }
    }

    if (!this.snakeIsAlive) {
      clearInterval(this.timer);
    }
  }

  createWall() {
    if (!this.wallContainer) {
      this.wallContainer = new PIXI.Container();
      this.app.stage.addChild(this.wallContainer);
    }

    const wall = new PIXI.Graphics();
    wall.beginFill(0x27865d);
    const wallPosition = this.generateFoodPosition(
      this.bodySnakePosition,
      this.walls
    );
    this.walls.push(wallPosition);
    wall.drawRect(wallPosition[1] * 20, wallPosition[0] * 20, 20, 20); // Нарисовать квадрат
    wall.endFill();
    this.wallContainer.addChild(wall);
  }

  updateScoreDisplay() {
    document.querySelector(".store__count").innerText = this.currentScore;
    document.querySelector(".best__count").innerText = this.bestScore;
  }

  updateScore() {
    this.currentScore++;
    this.updateScoreDisplay();
    if (this.currentScore > this.bestScore) {
      this.bestScore = this.currentScore;
      localStorage.setItem("bestScore", this.bestScore);
    }
  }

  initUI() {
    document.querySelector(".best__count").innerText = this.bestScore;
    document.querySelector(".store__count").innerText = this.currentScore;
  }
}
