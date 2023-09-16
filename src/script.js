const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const grid = 40;
const numRows = 12;
const numCols = 14;
//let playerX = 0; // La posición X del jugador en el canvas
//let playerY = 0; // La posición Y del jugador en el canvas
const playerSpeed = 4; // Velocidad de movimiento del jugador
const xColor = 'blue'; 
//pared blanda o destruible
const softWall = document.createElement('canvas');
const softWallCtx = softWall.getContext('2d');

//pausa
const pauseScreen = document.getElementById('pauseScreen');
pauseScreen.style.width = canvas.width + 'px';
pauseScreen.style.height = canvas.height + 'px';

const canvasRect = canvas.getBoundingClientRect();
pauseScreen.style.left = canvasRect.left + 'px';
pauseScreen.style.top = canvasRect.top + 'px';

const endGameScreen = document.getElementById('pauseScreen');
pauseScreen.style.width = canvas.width + 'px';
pauseScreen.style.height = canvas.height + 'px';
endGameScreen.style.left = canvasRect.left + 'px';
endGameScreen.style.top = canvasRect.top + 'px';

const pauseText = document.getElementById('pauseText');
let isPaused = false;
let pauseStartTime = null; 
let elapsedPausedTime = 0; // Tiempo total pausado acumulado

//sonidos
const bombPlace = new Audio();
const bombExplodes = new Audio();
const stageStart = new Audio();

bombPlace.src = 'sound/place_bomb.mp3';
bombExplodes.src = 'sound/boss_explosion.mp3';
stageStart.src = 'sound/stage_start.mp3';

bombPlace.addEventListener('canplaythrough', () => {
    // Comenzar el juego 
    generateLevel();
    bombPlace.play();
    requestAnimationFrame(loop);
});

let time = 90; //minutos


softWall.width = softWall.height = grid;

softWallCtx.fillStyle = "black";
softWallCtx.fillRect(0, 0, grid, grid);
softWallCtx.fillStyle = "#a9a9a9";

//1° fila cubos
softWallCtx.fillRect(1, 1, grid - 2, 20);

//2°fila cubos
softWallCtx.fillRect(0, 23, 20, 18);
softWallCtx.fillRect(22, 23, 42, 18);

//3°fila cubos
softWallCtx.fillRect(0, 43, 42, 20);
softWallCtx.fillRect(44, 43, 20, 20);

//pared
const wall = document.createElement('canvas');
const wallCtx = wall.getContext('2d');
wall.width = wall.height = grid;

wallCtx.fillStyle = 'black';
wallCtx.fillRect(0, 0, grid, grid);
wallCtx.fillStyle = 'white';
wallCtx.fillRect(0, 0, grid - 2, grid - 2);
wallCtx.fillStyle = "#a9a9a9";
wallCtx.fillRect(2, 2, grid - 4, grid - 4);

//mapa
const types = {
    wall: '🧱',
    softWall: 1,
    bomb: 2
}

let entidades = [];
let cells = [];

const template = [
     ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
    ['🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱'],
    ['🧱', 'x', 'x', '  ', '  ', '  ', '  ', '  ', '  ', '  ', '  ', '  ', 'x', 'x'],
    ['🧱', 'x', '🧱', '', '🧱', '', '🧱', '', '🧱', '', '🧱', '  ', '🧱'],
    ['🧱', 'x', '  ', '', '  ', '', '', '', '  ', '  ', '  ', '  ', '  ', 'x'],
    ['🧱', '', '🧱', '  ', '🧱', '', '🧱', '', '🧱', '', '🧱', '  ', '🧱'],
    ['🧱', '', '  ', '', '  ', '  ', '', '  ', '  ', '  ', '  ', '', '  ', ' '],
    ['🧱', ' ', '🧱', '  ', '🧱', '', '🧱', '', '🧱', '  ', '🧱', '  ', '🧱'],
    ['🧱', ' ', '  ', '  ', '  ', '  ', '  ', '  ', '  ', '  ', '  ', '  ', '  ', '', '🧱'],
    ['🧱', '', '🧱', '  ', '🧱', '', '🧱', '', '🧱', '', '🧱', '  ', '🧱'],
    ['🧱', 'x', '  ', '  ', '  ', '  ', '  ', '  ', '', '  ', '  ', '  ', '  ', 'x'],
    ['🧱', 'x', '🧱', '', '🧱', '  ', '🧱', '', '🧱', '', '🧱', '  ', '🧱'],
    ['🧱', 'x', 'x', '', '  ', '  ', '  ', '  ', '', '  ', '  ', '  ', 'x', 'x'],
    ['🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱', '🧱']
];

let score = 0;

//generar el nivel con paredes y paredes destruibles
function generateLevel() {
    cells = [];

    
    for (let row = 0; row < numRows; row++) {
        cells[row] = [];

        for (let col = 0; col < numCols; col++) {

            if (row === 0 && template[row][col] === 'x') {
                cells[row][col] = xColor; 
            } else if (!template[row][col] && Math.random() < 0.90) {
                cells[row][col] = types.softWall;
            } else if (template[row][col] === types.wall) {
                cells[row][col] = types.wall;
            }
            
        }
    }
    
    
}
// Función para colocar una nueva bomba
function placeBomb(row, col) {
    if (entidades.filter((entidad) => entidad.type === types.bomb && entidad.owner === player).length < player.numBombs) {
        const bomb = new Bomb(row, col, player.bombSize, player);
        entidades.push(bomb);
        cells[row][col] = types.bomb;
        bombPlace.play();
    }
}
//hacer explotar bomba y lo que rodea
function explotarBomba(bomb) {

    if (!bomb.alive) return;
    bomb.alive = false;

    //quita la bomba del grid
    cells[bomb.row][bomb.col] = null;

    //explota la bomba de acuerdo a su tamaño
    const dirs = [{
        //arriba
        row: -1,
        col: 0
    }, {
        //abajo
        row: 1,
        col: 0
    }, {
        //izquierda
        row: 0,
        col: -1
    }, {
        //derecha
        row: 0,
        col: 1
    }];

    dirs.forEach((dir) => {
        for (let i = 0; i < bomb.size; i++) {
            const row = bomb.row + dir.row * i;
            const col = bomb.col + dir.col * i;
            const cell = cells[row][col];

            //detiene la explosión si choca con una pared
            if (cell === types.wall) {
                return
            }else if (cell === types.softWall) {
                cells[row][col] = null;
                score += 10; // Incrementa el puntaje en 10 puntos
            }

            //explosión empieza en el centro
            entidades.push(new Explosion(row, col, dir, i === 0 ? true : false));
            cells[row][col] = null;

            //si la bomba choca con otra bomba
            if (cell === types.bomb) {

                //comparar posiciones
                const nextbomb = entidades.find((entidad) => {
                    return (
                        entidad.type === types.bomb &&
                        entidad.row === row && entidad.col === col
                    );
                });
                explotarBomba(nextbomb);
            }

            // Crea una nueva bomba si el jugador todavía tiene bombas disponibles
    if (entidades.filter((entidad) => entidad.type === types.bomb && entidad.owner === player).length < player.numBombs) {
        placeBomb(player.row, player.col);
    }

            //detiene la explosión si colisiona con algo
            if (cell) {
                return
            }
        }
    });
    
    bombExplodes.play();
}

//bomba
class Bomb {
    constructor(row, col, size, owner) {
        this.row = row;
        this.col = col;
        this.radio = grid * 0.4;
        this.size = size;
        this.owner = owner;
        this.alive = true;
        this.type = types.bomb;

        //timer 3 segs
        this.timer = 2000;

        //actualiza bomba en cada frame
        this.update = function (dt) {
            this.timer -= dt;

            //explota bomba si timer acaba
            if (this.timer <= 0) {
                return explotarBomba(this);

            }
            //cambiar el tamaño de la bomba cada medio segundo
            const interval = Math.ceil(this.timer / 500);
            if (interval % 2 === 0) {
                this.radio = grid * 0.4;
            } else {
                this.radio = grid * 0.5;
            }
        };
        //renderizar la bomba en cada frame
        this.render = function () {
            const x = (this.col + 0.5) * grid;
            const y = (this.row + 0.5) * grid;

            //dibujar bomba
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(x, y, this.radio, 0, 2 * Math.PI);
            ctx.fill();

            //dibujar mechero bomba
            const mecheroY = (this.radio === grid * 0.5 ? grid * 0.15 : 0);
            ctx.strokeStyle = "white";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(
                (this.col + 0.75) * grid,
                (this.row + 0.25) * grid - mecheroY,
                10, 0, Math.PI * 2
            );
            ctx.stroke();
        };
    }
}

class Explosion {
    constructor(row, col, dir, center) {
        this.row = row;
        this.col = col;
        this.dir = dir;
        this.alive = true;

        //muestra explosión por 0.5 seg.
        this.timer = 500;

        //actualizar la explosión en cada frame
        this.update = function (dt) {
            this.timer -= dt;

            if (this.timer <= 0) {
                this.alive = false;

            }
        };
        //renderizar la explosión en cada frame
        this.render = function () {
            const x = (this.col) * grid;
            const y = (this.row) * grid;
            const horizontal = this.dir.col;
            const vertical = this.dir.row;

            //generar efecto de fuego
            ctx.fillStyle = "#D72B16"; //rojo
            ctx.fillRect(x, y, grid, grid);

            ctx.fillStyle = "#F39642"; //naranja

            //si es vertical || horizontal
            if (center || horizontal) {
                ctx.fillRect(x, y + 6, grid, grid - 12);
            }
            if (center || vertical) {
                ctx.fillRect(x + 6, y, grid - 12, grid);
            }

            ctx.fillStyle = "#FFE5A8"; //amarillo
            if (center || horizontal) {
                ctx.fillRect(x, y + 12, grid, grid - 24);
            }
            if (center || vertical) {
                ctx.fillRect(x + 12, y, grid - 24, grid);
            }
        };
    }
}

//dibujar jugador
const player = {
    row: 1,
    col: 1,
    numBombs: 1,
    bombSize: 3,
    radio: grid * 0.35,
    render() {
        const x = (this.col + 0.5) * grid;
        const y = (this.row + 0.5) * grid;

        ctx.save();
        // Dibujar la imagen del jugador
        ctx.drawImage(playerImage, x - grid / 2, y - grid / 2, grid, grid);;
        ctx.restore();

    }
}

// Ciclo juego
let last;
let dt;
let gameOver = false;
let remainingTime = time * 1000; // Tiempo en milisegundos
function loop(timestamp) {
    
       if (isPaused || gameOver) {
        bombPlace.pause();
        bombExplodes.pause();
        stageStart.pause();

        if (pauseStartTime === null) {
            pauseStartTime = timestamp;
        }
        elapsedPausedTime = timestamp - pauseStartTime;
        requestAnimationFrame(loop);
        return; // No actualices ni dibujes nada mientras esté pausado
    }
    // Verificar condiciones de finalización
        if (score >= 250 || time <= 0) {
            endGame();
            gameOver = true;
            return;
        }

    // Si no está pausado, calcula el tiempo de juego restando el tiempo pausado
    const gameTime = timestamp - elapsedPausedTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(loop);

    // Calcular dif de tiempo
    if (!last) {
        last = timestamp;
    }
    dt = timestamp - last;
    last = timestamp;
// Actualizar el tiempo restante
    remainingTime -= dt;

    // Verificar si el tiempo se ha agotado
    if (remainingTime <= 0) {
        endGame();
        gameOver = true;
        return;
    }
    // Actualizar y renderizar todo en el grid
    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            switch (cells[row][col]) {
                case types.wall:
                    ctx.drawImage(wall, col * grid, row * grid);
                    break;
                case types.softWall:
                    ctx.drawImage(softWall, col * grid, row * grid);
                    break;
                case '🚪': // dibuja la puerta solo si el softWall se ha destruido
                    if (cells[row][col] !== types.softWall) {
                        ctx.fillText('🚪', col * grid, row * grid, grid, grid);
                    }
                    break;    
                    
            }
        }
    }
    // Actualizar y renderizar todas las entidades
    entidades.forEach((entidad) => {
        entidad.update(dt);
        entidad.render();

    });

    // Eliminar entidad muerta
    entidades = entidades.filter((entidad) => entidad.alive);

    player.render();
    drawTime(gameTime);

}

document.addEventListener('keydown', function (e) {
   
    let row = player.row;
    let col = player.col;
    let audioInitialized = false;

    if (!audioInitialized) {
        
        stageStart.play();
        audioInitialized = true;
    }

    
    // Movimientos
    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
            col--;
            break;
        case 'ArrowUp':
        case 'w':
            row--;
            break;
        case 'ArrowRight':
        case 'd':
            col++;
            break;
        case 'ArrowDown':
        case 's':
            row++;
            break;
        case ' ':
            if (!cells[row][col]) { // Espacio
                // Contar número de bombas
                if (entidades.filter((entidad) => {
                    return entidad.type === types.bomb &&
                        entidad.owner === player;
                }).length < player.numBombs) {
                    const bomb = new Bomb(row, col, player.bombSize, player);
                    entidades.push(bomb);
                    cells[row][col] = types.bomb;

                }
                if (!cells[row][col]) {
                    player.row = row;
                    player.col = col;
                }
                placeBomb(row, col);
            }
            bombPlace.play();
            break;
        case 'Enter':
            console.log('Tecla presionada:', e.key);
            if (isPaused) {
            // Ocultar la pantalla de pausa
            pauseScreen.style.display = 'none';
            
            } else {
            // Mostrar la pantalla de pausa
            pauseScreen.style.display = 'flex';

            }
            bombPlace.pause();
            bombExplodes.pause();
            stageStart.pause();

            isPaused = !isPaused; // Alternar entre pausado y no pausado
            break;
        default:
            break;
    }
        // Verificar si la nueva posición es válida antes de actualizarla
    if (isValidMove(row, col)) {
        player.row = row;
        player.col = col;
        player.render(); // Actualizar la posición del jugador en el canvas
    }
    
});

// Función para verificar si una posición es válida
function isValidMove(row, col) {
    
    return row > 0 && row < numRows && col >= 0 && col < numCols && cells[row][col] !== types.wall &&
        cells[row][col] !== types.softWall;
}



function drawTime(remainingTime) {
    const gameTimeInSeconds  = Math.max(0, 120 - Math.floor(remainingTime / 1000)); //tiempo en regresion
    const hours = Math.floor(gameTimeInSeconds  / 3600);
    const minutes = Math.floor((gameTimeInSeconds  % 3600) / 60);
    const seconds = gameTimeInSeconds  % 60;

    const formattedTime = `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
    ctx.font = "24px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Tiempo: " + formattedTime, 10, 30); 

     //Puntaje
    ctx.fillText("Puntaje: " + score, 400, 30);
}

// Crear una nueva imagen para el jugador
    const playerImage = new Image();
    playerImage.src = 'img/player.png';
    function padZero(num) {
        return num.toString().padStart(2, '0');
    }

// Función para comenzar el juego una vez que la imagen del jugador se haya cargado
playerImage.onload = function () {
    // Elegir una posición aleatoria para el jugador en las 'x'
    let playerRow, playerCol;
    do {
        playerRow = Math.floor(Math.random() * numRows);
        playerCol = Math.floor(Math.random() * numCols);
    } while (template[playerRow][playerCol] !== 'x'|| playerRow === 0);

    // Establecer la posición inicial del jugador
    player.row = playerRow;
    player.col = playerCol;

    // Comenzar el juego
    generateLevel();
    // Reproducir el sonido stageStart
    stageStart.play();
    requestAnimationFrame(loop);
};

// Función para seleccionar aleatoriamente una celda de softWall para la puerta
function selectRandomSoftWallCell() {
    const softWallCells = [];
    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            if (cells[row][col] === types.softWall) {
                softWallCells.push({ row, col });
            }
        }
    }
    // Elegir aleatoriamente una celda de softWall
    const randomIndex = Math.floor(Math.random() * softWallCells.length);
    return softWallCells[randomIndex];
}

function endGame() {
    isPaused = true; // Pausar el juego
    const gameTimeInSeconds = Math.floor(time / 1000);
    const formattedTime = `${padZero(Math.floor(gameTimeInSeconds / 3600))}:${padZero(Math.floor((gameTimeInSeconds % 3600) / 60))}:${padZero(gameTimeInSeconds % 60)}`;
   
    if (score >= 250) {
        const message = "¡Felicidades! Has ganado el juego";
        // Mostrar el mensaje de victoria en el canvas
        ctx.font = "24px Arial";
        ctx.fillStyle = "white";
        ctx.fillText(message, canvas.width / 2 - 200, canvas.height / 2);
        gameOver = true;
    } else if(formattedTime==='00:00:00'){
        const message = "¡Has perdido! El tiempo se agotó";
        // Mostrar el mensaje de derrota en el canvas
        ctx.font = "24px Arial";
        ctx.fillStyle = "white";
        ctx.fillText(message, canvas.width / 2 - 200, canvas.height / 2);
        gameOver = true;
    }

    // Detener la reproducción de sonidos
    bombPlace.pause();
    bombExplodes.pause();
    stageStart.pause();
}

