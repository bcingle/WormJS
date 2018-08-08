/** 
 * An implementation of a Logger.  Writes messages to console
 * if the logging level is set at least as high as the type
 * of message being logged.
*/
class Logger {
    /**
     * Construct a new logger with the given level
     * @param {{id: number, prefix: string}} level 
     */
    constructor(level = Logger.LogLevel.INFO) {
        this.level = level;
    }

    /**
     * Log a message
     * @param {string} message 
     * @param {{id: number, prefix: string}} level 
     */
    log(message, level = Logger.LogLevel.INFO) {
        if (level.id >= this.level.id) {
            console.log(level.prefix + ": " + message);
        }
    }

    trace(message) {
        this.log(message, Logger.LogLevel.TRACE);
    }

    debug(message) {
        this.log(message, Logger.LogLevel.DEBUG);
    }

    info(message) {
        this.log(message, Logger.LogLevel.INFO);
    }

    warn(message) {
        this.log(message, Logger.LogLevel.WARN);
    }

    error(message) {
        this.log(message, Logger.LogLevel.ERROR);
    }
}

Logger.LogLevel = {
    TRACE: {id: 0, prefix: 'TRACE'},
    DEBUG: {id: 1, prefix: 'DEBUG'},
    INFO: {id: 2, prefix: 'INFO'},
    WARN: {id: 3, prefix: 'WARN'},
    ERROR: {id: 4, prefix: 'ERROR'}
}

// Create a global logger
Logger.GlobalLogger = new Logger(Logger.LogLevel.INFO);

class FPSTimer {
    constructor(tick = 1000) {
        this.last = Date.now();
        this.frames = 0;
        this.currentFps = -1;
        this.tick = tick;
    }
    getFps() {
        let now = Date.now();
        let elapsed = now - this.last;
        let fps = -1;
        if (elapsed > 0 && this.frames > 0) {
            fps = (this.frames / elapsed) * 1000;
        }
        this.last = now;
        this.frames = 0;
        return fps;
    }
    start() {
        let self = this;
        this.interval = setInterval(function () {self.currentFps = self.getFps()}, this.tick);
    }
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
    frame() {
        this.frames += 1;
    }
}

/** A sprite is a rectangular object that gets drawn on the canvas */
class Sprite {
    /**
     * 
     * @param {*} x 
     * @param {*} y 
     * @param {*} width 
     * @param {*} height 
     * @param {*} color 
     * @param {*} scale Multiplier for width and height. E.g. A scale of 3 makes a 1x1 rectangle appear as 3x3
     */
    constructor(x = 0, y = 0, width = 1, height = 1, color = '#000000', scale = 1) {
        this.x = Math.floor(x);
        this.y = Math.floor(y);
        this.width = width;
        this.height = height;
        this.color = color;
        this.scale = scale;
    }

    /** 
     * Business logic that should occur prior to painting
    */
    frame() {
        // a regular sprite doesn't do anything during a frame
    }
    
    /**
     * Paint this sprite to the given canvas
     * @param {*} canvas A canvas object
     */
    paint(canvas) {
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x * this.scale, this.y * this.scale, 
            this.width * this.scale, this.height * this.scale);
    }
    
    /**
     * Detect whether this sprite is colliding with another (occupying the same space)
     * @param {*} otherSprite 
     */
    isCollision(otherSprite) {
        return this.x === otherSprite.x && this.y === otherSprite.y;
    }
}

/** A Sprite that does not collide with other Sprites */
class NonCollidingSprite extends Sprite {
    constructor(x = 0, y = 0, width = 1, height = 1, color = '#000000', scale = 1) {
        super(x, y, width, height, color, scale);
    }

    /**
     * NonCollidingSprites do not collide with anything
     * @param {*} other 
     */
    isCollision(other) {
        return false;
    }
}

/** A special Sprite that covers the whole background with a background color */
class BackgroundSprite extends Sprite {
    /**
     * 
     * @param {*} width The width of the canvas
     * @param {*} height The height of the canvas
     * @param {*} color The background color
     */
    constructor(width, height, color = '#333333') {
        super(0, 0, width, height, color, 1);
    }

    paint(canvas) {
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, this.width, this.height);
        super.paint(canvas);
    }
}

class HUDSprite extends Sprite {
    constructor(game, x = 5, y = 5) {
        super(x, y);
        this.game = game;
    }

    paint(canvas) {
        var ctx = canvas.getContext('2d');
        
        const fontSize = 8;
        const lineHeight = fontSize * 1.2;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.font = `${fontSize}px Arial`;
        let y = this.y + lineHeight;
        ctx.fillText('Score: ' + this.game.score, this.x, y);
        y += lineHeight;
        ctx.fillText(`Apple: (${this.game.apple.x},${this.game.apple.y})`, this.x, y);
        y += lineHeight;
        ctx.fillText(`Worm: (${this.game.worm.x},${this.game.worm.y})`, this.x, y);
    }
}

class SettingsSprite extends Sprite {
    constructor(game, x, y, width, height, bgColor = '#cccccc', fgColor = '#333333') {
        super(x, y, width, height, '#cccccc', 1);
        this.fgColor = fgColor;
        this.game = game;
    }
    paintBackground(canvas) {
        super.paint(canvas);
    }
    paintSoundIcon(canvas, x, y) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = this.fgColor;
        ctx.strokeStyle = this.fgColor;
        // draw the speaker part
        ctx.beginPath();
        ctx.moveTo(x, y + 4);
        ctx.lineTo(x + 4, y + 4);
        ctx.lineTo(x + 8, y);
        ctx.lineTo(x + 8, y + 12);
        ctx.lineTo(x + 4, y + 8);
        ctx.lineTo(x, y + 8);
        ctx.closePath();
        ctx.fill();
        if (!this.game.mute) {
            // draw the sound waves
            ctx.beginPath();
            ctx.arc(x + 8, y + 6, 2, (2 * Math.PI) - 1, 1);
            ctx.arc(x + 8, y + 6, 5, (2 * Math.PI) - 1, 1);
            ctx.arc(x + 8, y + 6, 7, (2 * Math.PI) - 1, 1);
            ctx.stroke();
        } else {
            // draw the X
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 4);
            ctx.lineTo(x + 14, y + 8);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 8);
            ctx.lineTo(x + 14, y + 4);
            ctx.stroke();
        }
    }
    paint(canvas) {
        this.paintBackground(canvas);
        const x = this.x + 5;
        const y = this.y + ((this.height / 2) - 6)
        this.paintSoundIcon(canvas, x, y);
    }
}

class PopoverSprite extends Sprite {
    constructor(x, y, width, height, textArr = []) {
        super(x, y, width, height, '#ffffff', 1);
        this.textArr = textArr;
    }
    paint(canvas) {
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#cccccc';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#000000';
        var px = canvas.width / 20;
        var x = canvas.width / 2;
        var lineHeight = px * 1.2;
        var textHeight = lineHeight * this.textArr.length;
        var y = (canvas.height / 2) - (textHeight / 2);
        ctx.font = Math.floor(px * 2) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.textArr[0], x, y);
        y += lineHeight * 2;
        ctx.font = Math.floor(px) + 'px Arial';
        for (var i = 1; i < this.textArr.length; i++) {
            ctx.fillText(this.textArr[i], x, y);
            y += lineHeight;
        }
    }
}

class HelpSprite extends PopoverSprite {
    constructor(x, y, width, height) {
        super(x, y, width, height, ['Help', ' ', 'Up/Down/Left/Right: Move Worm', 'Space: Pause/Resume', 'D: Enable/Disable Debug', 'S: Mute/Unmute']);
    }
}

class GameOverSprite extends PopoverSprite {
    constructor(x, y, width, height, score = 0) {
        super(x, y, width, height, ['Game Over', '', ' ', 'Space: Restart'])
        this.score = score;
    }
    set score(score) {
        this.textArr[1] = 'Score: ' + score;
    }
}

/** A Sprite that can move.  Moves one position in the object's direction every frame. */
class MovingSprite extends Sprite {
    constructor(direction = MovingSprite.Direction.NONE, x = 0, y = 0, color = '#000000', scale = 1) {
        super(x, y, 1, 1, color, scale);
        this.direction = direction;
    }
    frame() {
        super.frame();
        this.move();
    }
    /** 
     * Move is called every frame and is intended to move the Sprite by 1 position
    */
    move() {
        // move in the right direction
        this.x += this.direction.x * this.scale;
        this.y += this.direction.y * this.scale;
    }
}

MovingSprite.Direction = {
    UP: {x: 0, y: -1},
    DOWN: {x: 0, y: 1},
    LEFT: {x: -1, y: 0},
    RIGHT: {x: 1, y: 0},
    NONE: {x: 0, y: 0}
}

class Apple extends Sprite {
    constructor(scale, x = 0, y = 0, color = '#ff0000') {
        super(x, y, 1, 1, color, scale);
    }
}

class WormPart extends Sprite {
    constructor(scale, x = 0, y = 0, color = '#0000ff') {
        super(x, y, 1, 1, color, scale);
    }
}

class Worm extends MovingSprite {
    constructor(parts, direction = MovingSprite.Direction.RIGHT, x = 0, y = 0) {
        super(direction, x, y);
        this.parts = parts
    }

    move() {
        super.move();
        this.addHead();
    }

    paint(canvas) {
        for (let i = 0; i < this.size(); i++) {
            this.parts[i].paint(canvas);
        }
    }

    addHead() {
        let newPart = new WormPart(this.getHead().scale, this.x, this.y);
        this.parts.push(newPart);
        return newPart;
    }

    getHead() {
        return this.parts[this.size() - 1];
    }

    size() {
        return this.parts.length;
    }

    removeTail() {
        return this.parts.shift();
    }

}

Worm.StartingWorm = new Worm([new WormPart(10, 10), new WormPart(11, 10), new WormPart(12, 10)], MovingSprite.Direction.RIGHT, 10, 10);

/** 
 * An Animator is a superclass that controls game and render loops.  In this
 * animation, there are two different loops.  One is for rendering, the other
 * is for game logic.  The render loop runs as fast as the browser will run it,
 * typically 60 fps or the refresh rate of the monitor.  The game loop frames
 * per second can be specified.  Each render loop, the render(frameCount) method will
 * be called.  For each game loop, the frame(frameCount) method will be called.
*/
class Animator {
    constructor(fps = 30) {
        this.fps = fps;
        this.last = 0;
        this.frameCount = 1;
        this.running = false;
        this.frameListeners = [];
    }
    gameLoop() {
        if (!this.running) {
            return;
        }
        let now = Date.now();
        Logger.GlobalLogger.trace('Running a game loop');
        this.frame(this.frameCount);
        this.frameCount += 1;
        Logger.GlobalLogger.trace('Calling frame listeners');
        for (let i = 0; i < this.frameListeners.length; i++) {
            this.frameListeners[i]();
        }
        this.lastFrame = now;

        const self = this;
        now = Date.now();
        const frameInterval = 1000 / this.fps;
         // schedule the next game loop based on the current fps
        setTimeout(function () {
            self.gameLoop();
        }, frameInterval);
    }
    renderLoop() {
        if (!this.running) {
            return;
        }
        Logger.GlobalLogger.trace('Rendering');
        this.render(this.frameCount);
        const self = this;
        // requeue this method to run on the next animation frame
        window.requestAnimationFrame(function () {
            self.renderLoop();
        });
    }
    start() {
        this.running = true;
        this.renderLoop();
        this.gameLoop();
    }
    stop() {
        this.running = false;
    }
    frame(frameCount) {
        // not implemented - please override
    }
    render(frameCount) {
        // not implemented - please override
    }
    addFrameListener(listener) {
        this.frameListeners.push(listener);
    }
}


class WormJS extends Animator {
    constructor(canvas, scale = 5, speed = 10) {
        super(speed);
        this.resetFps = speed;
        this.canvas = canvas;
        this.scale = scale;
        this.width = canvas.width;
        this.height = canvas.height;
        this.scale = scale;

        this.board = {
            width: canvas.width,
            height: canvas.height - 20
        }

        this.background = new BackgroundSprite(this.board.width, this.board.height);
        this.gameOverText = new GameOverSprite(10, 10, this.board.width - 20, this.board.height - 20);
        this.helpText = new HelpSprite(10, 10, this.board.width - 20, this.board.height - 20);
        this.hudText = new HUDSprite(this, 5, 5);
        this.settingsBar = new SettingsSprite(this, 0, this.board.height, this.board.width, this.height - this.board.height);
        this.gameState = WormJS.GameState.PAUSED;
        this.timer = new FPSTimer();
        this.debug = false;
        this.mute = true;

        this.audioContext = new AudioContext();

        this.reset();
    }

    start() {
        Logger.GlobalLogger.info('Starting WormJS');
        this.timer = new FPSTimer();
        this.timer.start();
        super.start();
        Logger.GlobalLogger.debug('WormJS Started');
        var osc = this.audioContext.createOscillator();
        osc.frequency.value = 440;
        osc.type = 'square';
        osc.connect(this.audioContext.destination);
        //osc.start(0);
    }

    processKeys() {
        Logger.GlobalLogger.trace('Processing key presses');
        while (this.movementQueue.length > 0) {
            let mvmt = this.movementQueue.shift();
            Logger.GlobalLogger.trace('Processing key press ' + JSON.stringify(mvmt));
            // skip key presses that are same or opposite direction
            if ((this.worm.direction === MovingSprite.Direction.LEFT || this.worm.direction === MovingSprite.Direction.RIGHT) &&
                (mvmt === MovingSprite.Direction.LEFT || mvmt === MovingSprite.Direction.RIGHT)) {
                    Logger.GlobalLogger.trace('Skipping key press');
                    continue;
            }
            if ((this.worm.direction === MovingSprite.Direction.UP || this.worm.direction === MovingSprite.Direction.DOWN) &&
                (mvmt === MovingSprite.Direction.UP || mvmt === MovingSprite.Direction.DOWN)) {
                    Logger.GlobalLogger.trace('Skipping key press');
                    continue;
            }
            Logger.GlobalLogger.trace('Accepting key press');
            this.worm.direction = mvmt;
            break;
        }
        Logger.GlobalLogger.trace('Done processing keys');
    }

    render(frameCount) {
        Logger.GlobalLogger.trace('Painting');
        this.background.paint(this.canvas);
        if (this.debug) {
            Logger.GlobalLogger.trace('Debugging, painting debug HUD text');
            this.hudText.paint(this.canvas);
        }
        this.worm.paint(this.canvas);
        this.apple.paint(this.canvas);
        if (this.gameState === WormJS.GameState.PAUSED) {
            Logger.GlobalLogger.trace('Pause, painting help text');
            this.helpText.paint(this.canvas);
        }
        if (this.gameState === WormJS.GameState.GAMEOVER) {
            Logger.GlobalLogger.trace('Game Over, painting game over text');
            this.gameOverText.paint(this.canvas);
        }
        this.settingsBar.paint(this.canvas);
    }

    frame(frameCount) {
        Logger.GlobalLogger.trace('Starting game frame');
        this.timer.frame();
        this.processKeys();
        if (this.gameState === WormJS.GameState.PLAYING) {
            Logger.GlobalLogger.trace('Playing game: Calling movement frames');
            this.apple.frame();
            this.worm.frame();
            Logger.GlobalLogger.trace('Detecting collisions');
            // detect a collision with the apple
            if (this.worm.isCollision(this.apple)) {
                Logger.GlobalLogger.debug('Detected collision with apple');
                this.levelUp();
            } else {
                this.worm.removeTail();
            }
            // detect a collision with self
            for (let i = 0; i < this.worm.size() - 1; i++) {
                Logger.GlobalLogger.trace('Checking for collision with part ' + i);
                let part = this.worm.parts[i];
                if (part.isCollision(this.worm)) {
                    Logger.GlobalLogger.debug('Detected collision with self');
                    this.gameOver();
                }
            }
            // detect a collision with the wall
            if (this.worm.x < 0 || 
                    this.worm.y < 0 || 
                    this.worm.x >= this.board.width / this.scale || 
                    this.worm.y >= this.board.height / this.scale) {
                Logger.GlobalLogger.debug('Detected collision with wall');
                this.gameOver();
            }
        }
        
    }

    levelUp() {
        Logger.GlobalLogger.info('Level Up!');
        this.apple = this.randomApple();
        this.score += 1;
        this.fps += .25;
        Logger.GlobalLogger.debug('New Score: ' + this.score);
        Logger.GlobalLogger.debug('New FPS: ' + this.fps);
        Logger.GlobalLogger.debug('New Apple: (' + this.apple.x + ', ' + this.apple.y + ')');
    }

    gameOver() {
        Logger.GlobalLogger.info("Game Over!");
        this.gameState = WormJS.GameState.GAMEOVER;
        this.gameOverText.score = this.score;
    }

    reset() {
        Logger.GlobalLogger.info('Resetting Game');
        this.movementQueue = [];
        this.score = 0;
        this.fps = this.resetFps;
        this.worm = this.newWorm(10, 10);
        this.apple = this.randomApple();
        Logger.GlobalLogger.trace('New Score: ' + this.score);
        Logger.GlobalLogger.trace('New FPS: ' + this.fps);
        Logger.GlobalLogger.debug('New Apple: (' + this.apple.x + ', ' + this.apple.y + ')');
    }

    pause() {
        Logger.GlobalLogger.info('Pausing Game');
        this.gameState = WormJS.GameState.PAUSED;
    }

    resume() {
        Logger.GlobalLogger.info('Resuming Game');
        this.gameState = WormJS.GameState.PLAYING;
    }

    randomApple() {
        Logger.GlobalLogger.trace('Creating a new random apple');
        let x = Math.floor(Math.random() * (this.board.width / this.scale));
        let y = Math.floor(Math.random() * (this.board.height / this.scale));
        Logger.GlobalLogger.trace('New apple position: (' + x + ', ' + y + ')')
        return new Apple(this.scale, x, y);
    }

    newWorm(x, y) {
        Logger.GlobalLogger.trace('Creating a new worm');
        let parts = [
            new WormPart(this.scale, x - 2, y), // tail
            new WormPart(this.scale, x - 1, y),
            new WormPart(this.scale, x, y), // head
        ];
        let worm = new Worm(parts, MovingSprite.Direction.RIGHT, x, y);
        return worm;
    }

    keyDown(key) {
        Logger.GlobalLogger.debug('Handling key press: ' + key);
        switch(key) {
            case 'd':
            case 'KeyD':
                this.onDKey();
                break;
            case 's':
            case 'KeyS':
                this.onSKey();
                break;
            case 'ArrowLeft':
                this.onLeftKey();
                break;
             case 'ArrowRight':
                this.onRightKey();
                break;
            case 'ArrowUp':
                this.onUpKey();
                break;
            case 'ArrowDown':
                this.onDownKey();
                break;
            case ' ':
            case 'Space':
                this.onSpaceKey();
                break;
        }
    }

    onLeftKey() {
        Logger.GlobalLogger.trace('Handling left arrow key press');
        this.movementQueue.push(MovingSprite.Direction.LEFT);
    }

    onRightKey() {
        Logger.GlobalLogger.trace('Handling right arrow key press');
        this.movementQueue.push(MovingSprite.Direction.RIGHT);
    }

    onUpKey() {
        Logger.GlobalLogger.trace('Handling up left arrow key press');
        this.movementQueue.push(MovingSprite.Direction.UP);
    }

    onDownKey() {
        Logger.GlobalLogger.trace('Handling down arrow key press');
        this.movementQueue.push(MovingSprite.Direction.DOWN);
    }

    onSpaceKey() {
        Logger.GlobalLogger.trace('Handling spacebar key press');
        Logger.GlobalLogger.trace('Current game state: ' + JSON.stringify(this.gameState));
        switch(this.gameState) {
            case WormJS.GameState.PLAYING:
                this.pause();
                break;
            case WormJS.GameState.GAMEOVER:
                this.reset();
            case WormJS.GameState.PAUSED:
                this.resume();
                break;
        }
    }

    onDKey() {
        Logger.GlobalLogger.debug('Toggling debug status');
        this.debug = !this.debug;
    }

    onSKey() {
        Logger.GlobalLogger.debug('Toggling mute status');
        this.mute = !this.mute;
    }

}

WormJS.GameState = {
    PLAYING: 0,
    PAUSED: 1,
    GAMEOVER: 2
}


