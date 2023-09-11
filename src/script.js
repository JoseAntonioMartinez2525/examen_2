
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const grid = 64;
const numRows = 13;
const numCols = 15;

//pared blanda o destruible
const softWall = document.createElement('canvas');
const softWallCtx = softWall.getContext('2d');
softWall.width = softWall.height = grid;

softWallCtx.fillStyle ="black";
softWallCtx.fillRect(0,0,grid,grid);
softWallCtx.fillStyle ="#a9a9a9";

//1° fila cubos
softWallCtx.fillRect(1,1,grid-2,20);

//2°fila cubos
softWallCtx.fillRect(0,23,20,18);
softWallCtx.fillRect(22,23,42,18);

//3°fila cubos
softWallCtx.fillRect(0,43,42,20);
softWallCtx.fillRect(44,43,20,20);

//pared
const wall = document.createElement('canvas');
const wallCtx = wall.getContext('2d');
wall.width = wall.height = grid;

wallCtx.fillStyle = 'black';
wallCtx.fillRect(0,0,grid,grid);
wallCtx.fillStyle = 'white';
wallCtx.fillRect(0,0,grid-2,grid-2);
wallCtx.fillStyle ="#a9a9a9";
wallCtx.fillRect(2,2,grid-4,grid-4);

//mapa
const types = {
    wall: '\\u{03A9}',
    softWall:1,
    bomb:2
}

let entidades = [];
let cells = [];

const template = [
    ['\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}'],
    ['\\u{03A9}','x','x','  ','  ','  ','  ','  ','  ','  ','  ','  ','x','x'],
    ['\\u{03A9}','x','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}'],
    ['\\u{03A9}','x','  ','  ','  ','  ','  ','  ','  ','  ','  ','  ','  ','x'],
    ['\\u{03A9}',' ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}'],
    ['\\u{03A9}',' ','  ','  ','  ','  ','  ','  ','  ','  ','  ','  ','  ',' '],
    ['\\u{03A9}',' ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}'],
    ['\\u{03A9}',' ','  ','  ','  ','  ','  ','  ','  ','  ','  ','  ','  ',' '],
    ['\\u{03A9}',' ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}'],
    ['\\u{03A9}','x','  ','  ','  ','  ','  ','  ','  ','  ','  ','  ','  ','x'],
    ['\\u{03A9}','x','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}','  ','\\u{03A9}'],
    ['\\u{03A9}','x','x','  ','  ','  ','  ','  ','  ','  ','  ','  ','x','x'],
    ['\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}','\\u{03A9}']
];

//generar el nivel con paredes y paredes destruibles
function generateLevel(){
    cells = [];
    for (let row = 0; row < numRows; row++) {
    cells[row] = [];

        for (let col = 0; col < numCols; col++) {
           
            if (!template[row][col] && Math.random() < 0.90) {
                cells[row][col] = types.softWall;
            }else if(template[row][col]===types.wall){
                cells[row][col] = types.wall;
            }
        }
        
    }
}

//hacer explotar bomba y lo que rodea
function explotarBomba(bomb){

    if(!bomb.alive) return;
    bomb.alive = false;

    //quita la bomba del grid
    cells[bomb.row][bomb.col]= null;

    //explota la bomba deacuerdo a su tamaño
    const dirs = [{
        //arriba
        row:-1,
        col:0
    }, {
        //abajo
        row:1,
        col:0       
    }, {
        //izquerda
        row:0,
        col:-1       
    }, {
        //derecha
        row:0,
        col:1      
    }];

    dirs.forEach((dir)=>{
        for (let i = 0; i < bomb.size; i++) {
            const row = bomb.row + dir.row * i;
            const col = bomb.col + dir.col * i;
            const cell = cells[row][col];

            //detiene la explosion si choca  con una pared
            if (cell === types.wall) {
                return
            }

            //explosion empieza en el centro
            entidades.push(new Explosion(row, col, dir, i === 0 ? true:false));
            cells[row][col] = null;

            //si la bomba choca con otra bomba
            if (cell === types.bomb) {
                
                //comparar  posiciones
                const nextbomb = entidades.find((entidad)=>{
                    return(
                        entidad.type === types.bomb &&
                        entidad.row === row && entidad.col === col
                    );
                });
                explotarBomba(nextbomb);
            }

            //detiene la explosion si colisiona con algo
            if(cell){
                return
            }
        }
    });
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
        this.timer = 3000;

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

        //muestra explosion por 3 seg.
        this.timer = 3000;

        //actualizar la explosion en cada frame
        this.update = function (dt) {
            this.timer -= dt;

            if (this.timer <= 0) {
                this.alive = false;

            }
        };
        //renderizar la explosion en cada frame
        this.render = function () {
            const x = (this.col + 0.5) * grid;
            const y = (this.row + 0.5) * grid;
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
        row:1,
        col:1,
        numBombs:1,
        bombSize:3,
        radio:grid*0.35,
        render(){
            const x = (this.col + 0.5) * grid;
            const y = (this.row + 0.5) * grid;

            ctx.save();
            ctx.fillStyle="white";
            ctx.beginPath();
            ctx.arc(x, y, this.radio, 0, 2 * Math.PI);
            ctx.fill();


        }
    }
    //ciclo juego
    let last;
    let dt;

    function loop(timestamp){
        requestAnimationFrame(loop);
        ctx.clearRect(0,0,canvas.width,canvas.height);

        //Calcular dif de tiempo
        if (!last) {
            last = timestamp;
        }
        dt = timestamp-last;
        last = timestamp;

        //Actualizar y renderizar todo en el grid
        for(let row = 0;row<numRows; row++){
            for(let col = 0;col<numCols; col++){
                switch (cells[row][col]) {
                    case types.wall:
                        ctx.drawImage(wall,col * grid,row * grid);
                        break;
                    case types.softWall:
                        ctx.drawImage(softWall,col * grid,row * grid);
                        break;
                }
            
        } 
     }
     //actualizar y renderizar todas las entidades
     entidades.forEach((entidad)=>{
        entidad.update(dt);
        entidad.render();

     });

     //eliminar entidad muerta
     entidades = entidades.filter((entidad)=>entidad.alive);

     player.render();

    }
document.addEventListener('DOMContentLoaded', function (){
//Comenzar juego
generateLevel();
requestAnimationFrame(loop);
});
