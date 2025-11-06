import {Cell} from './cell.js';

export class World {
    //CONSTRUCTOR (ancho por defecto 40)
    constructor(n = 40){
        this.n = n;
        this.matrix = this.setMatrix();
        this.timer = null;

        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.CELL_SOUND_DURATION = 0.1;
    }

    //Metodo para construir la matriz de mundo
    setMatrix(){
        const matrix = [];

        for(let i = 0; i<this.n; i++){
            matrix[i] = [];
            for(let j = 0; j<this.n; j++){
                matrix[i][j] = new Cell();
            }
        }

        return matrix;
    }

    updateMatrix(){
        //Creamos una nueva matriz para la siguiente generacion
        //aunque ocupa mas memoria me ahorro recorrer la matriz dos veces
        const nextMatrix = this.setMatrix();

        //recorremos toda la matriz guardando los vecinos vivos en ese momento
        //y actualizamos las nueva matriz con las reglas de Conway
        for(let i = 0; i<this.n; i++){
            for(let j = 0; j<this.n; j++){
                const cell = this.matrix[i][j];
                const newCell = nextMatrix[i][j];
                cell.adjCells = this.calculateNeighbours(i, j);


                //reglas de Conway
                if(!cell.alive && cell.adjCells === 3) {
                    this.playCellSound();
                    newCell.alive = true; 
                    newCell.timeAlive = 0;
                }
                else if(cell.alive && (cell.adjCells === 2 || cell.adjCells === 3)){
                    newCell.alive = true;
                    newCell.timeAlive = cell.timeAlive + 1; //se sigue con el contador de vivo
                }
                else {
                    newCell.alive = false;
                    newCell.timeAlive = 0;
                }

            }
        }

        //Actulizamos matrices
        this.matrix = nextMatrix;
    }

    calculateNeighbours(x, y){
        let counter = 0;

        //Queremos comprobar las vecinas(por intervalos), pero si estamos en 
        // un extremo, tenemos que coger la fila/columna x-1 y nos daria un
        // outOfBounds, entonces tenemos que ajustar los valores negativos a 
        //el rango de n.

        //La funcion que hace esto se ve asi matematicamente
        // (value % n) --> esto bastaria en otros lenguajes,
        //  pero en js puede devolver valores nagativos

        //Simplemente para eliminar posibles signos le sumamos n y dividimos entre n otra vez

        const wrap = (value) => ((value % this.n) + this.n) % this.n;

        //Recorremos de x-1 a x+1 (es decir la submatriz 3x3 cuya celda 1,1 es x,y)
        for(let i = x-1; i<= x+1; i++){

            for(let j = y-1; j<=y+1; j++){

                if(i == x && j == y) continue;
                //Ajustamos al rango y comprobamos si devuelve true el valor de esa celda
                if(this.matrix[wrap(i)][wrap(j)].alive) counter++;

            }

        }

        return counter;

    }

    //Sonido de celula al crearse
    playCellSound() {
        const audio = new Audio("/media/cell.wav");
        audio.volume = 0.005;
        audio.play();
    }

}

