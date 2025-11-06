import { World } from "./world.js";

//HECHO POR DIEGO PALENCIA MARTINEZ

//De aqui el audio https://freesound.org/people/IykqiC0/sounds/180072 que he recortado
//El favicon es un emoji de dominio publico.

const patterns = { //Algunos de aqui https://es.wikipedia.org/wiki/Juego_de_la_vida
    none: [],
    glider: [
        [0, 1],
        [1, 2],
        [2, 0],
        [2, 1],
        [2, 2]
    ],
    blinker: [
        [1, 0],
        [1, 1],
        [1, 2]
    ],
    boat: [
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 2],
        [2, 1]
    ],
    smallExploder: [
        [0, 1],
        [1, 0], [1, 1], [1, 2],
        [2, 0], [2, 2],
        [3, 1]
    ],
    pulsar: [
        [2,4],[2,5],[2,6],[2,10],[2,11],[2,12],
        [4,2],[5,2],[6,2],[4,7],[5,7],[6,7],[4,9],[5,9],[6,9],[4,14],[5,14],[6,14],
        [7,4],[7,5],[7,6],[7,10],[7,11],[7,12],
        [9,4],[9,5],[9,6],[9,10],[9,11],[9,12],
        [10,2],[11,2],[12,2],[10,7],[11,7],[12,7],[10,9],[11,9],[12,9],[10,14],[11,14],[12,14],
        [14,4],[14,5],[14,6],[14,10],[14,11],[14,12]
    ],
    gosperGliderGun: [
        [5,1],[5,2],[6,1],[6,2],
        [3,13],[3,14],[4,12],[4,16],[5,11],[5,17],[6,11],[6,15],[6,17],[6,18],[7,11],[7,17],[8,12],[8,16],[9,13],[9,14],
        [1,25],[2,23],[2,25],[3,21],[3,22],[4,21],[4,22],[5,21],[5,22],[6,23],[6,25],[7,25],
        [3,35],[3,36],[4,35],[4,36]
    ],
    toad: [
        [1,2],[1,3],[1,4],
        [2,1],[2,2],[2,3]
    ],
    beacon: [
        [0,0],[0,1],[1,0],[1,1],
        [2,2],[2,3],[3,2],[3,3]
    ],
    pentadecathlon: [
        [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],
        [2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3]
    ]
};



document.addEventListener("DOMContentLoaded", () => {
    //VARIABLES GLOBALES
    let n = 40;
    let fps = 10;
    let cell_size = 15;

    let world = new World(n);
    let timer = null;
    let totalTime = 0;

    const canvas = document.getElementById("world");
    const ctx = canvas.getContext("2d");
    const info = document.getElementById("info");

    let hover = null;

    //BOTONES E INPUTS
    const startButton = document.getElementById("start");
    const stopButton = document.getElementById("stop");
    const clearButton = document.getElementById("clear");
    const fpsInput = document.getElementById("fps");
    const sizeInput = document.getElementById("size");
    const applyButton = document.getElementById("apply");
    const patternSelect = document.getElementById("pattern");

    //INICIALIZACION DEL CANVAS
    function initCanvas() {

        //PARA EL CANVAS VAMOS A INTENTAR QUE SEA REESCALABLE
        //El tamaño de celda se ajusta al tamaño del contenedor

        //Accedemos al contenedor del canvas y cogemos sus dimensiones
        const wrapper = document.querySelector('.canvas-wrap');
        const rect = wrapper.getBoundingClientRect();

        //Asignamos el tamaño máximo posible según el espacio del wrapper
        const maxW = rect.width;
        const maxH = rect.height;

        //Calculamos el tamaño ideal de celda
        cell_size = Math.floor(Math.min(maxW / n, maxH / n));

        //Calculamos el tamaño final del canvas en CSS
        const cssSize = cell_size * n;

        //Escalado para pantallas HiDPI (Si no se ve super pixelado en pantalla de alto DPI)
        const ratio = window.devicePixelRatio || 1;

        //ESTO SOLO CAMBIA EL TAMAÑO EN CSS
        //es decir, cambia el visual, pero no la resoluición real del canvas
        //luego toca multiplicarlo por el ratio
        canvas.style.width = `${cssSize}px`;
        canvas.style.height = `${cssSize}px`;

        //Ajustamos el tamaño real del canvas en pixeles
        canvas.width = Math.round(cssSize * ratio);
        canvas.height = Math.round(cssSize * ratio);

        // Ajustar todo lo que se dibuja a este nuevo ratio
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    //FUNCION DE DIBUAJDO (CAMBIO DE COLOR SEGUN TIEMPO VIVO)
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const cell = world.matrix[i][j];

                if (cell.alive) {
                    
                    if (cell.timeAlive === 0) {
                        //Nueva celda es negra siempre
                        ctx.fillStyle = "black";
                    } else {
                        //De negro a rojo con el tiempo
                        //Aumenta el rojo mientras disminuye el verde/azul
                        const color = Math.min(255, Math.floor(cell.timeAlive * 1.2)); // ajusta velocidad
                        ctx.fillStyle = `rgb(${color}, 0, 0)`;
                    }
                } else {
                    ctx.fillStyle = "white";
                }

                ctx.fillRect(j * cell_size, i * cell_size, cell_size, cell_size);
                ctx.strokeStyle = "#ddd";
                ctx.strokeRect(j * cell_size, i * cell_size, cell_size, cell_size);
            }
        }
    }

    //CONVERSION DE POS DE CANVAS A POS DE CELDA
    function canvasPos(x, y){
        let i = Math.floor(y / cell_size);
        let j = Math.floor(x / cell_size);

        // Limitar a rango válido
        i = Math.max(0, Math.min(n - 1, i));
        j = Math.max(0, Math.min(n - 1, j));

        return [i, j];
    }

    //HABILITAR/DESHABILITAR CONTROLES MIENTRAS EL JUEGO ESTA EN MARCHA
    function disableControls(disabled) {
        clearButton.disabled = disabled;
        fpsInput.disabled = disabled;
        sizeInput.disabled = disabled;
        applyButton.disabled = disabled;

        // Permite usar el ratón siempre
        canvas.style.pointerEvents = 'auto';
    }

    //UPDATE SALIDA
    function updateInfo() {
        let hoverText = "Posición: -, Tiempo vivo: -";

        if(hover != null ){
            
            const [i, j] = hover;
            const cell = world.matrix[i][j];
            hoverText = `Posición: (${i}, ${j}), Tiempo vivo: ${(cell.timeAlive / fps).toFixed(2)} s`;
        }

        info.textContent = `⏱ Tiempo total: ${totalTime.toFixed(2)} s\n${hoverText}`;

    }

    //CLICK EN UNA CELDA
    //cambio de estado de la celda y dibujo
    canvas.addEventListener("click", (e) => {
        if(timer) return; //no se puede editar mientras esta en marcha
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        //conversion de x y a coordenadas de celda
        const [i, j] = canvasPos(x, y);

        const cell = world.matrix[i][j];
        cell.alive = !cell.alive;
        if(cell.alive) world.playCellSound();
        draw();
    });    

    //MOUSE OVER EN UNA CELDA
    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        //conversion de x y a coordenadas de celda
        const [i, j] = canvasPos(x, y);
        hover = canvasPos(x, y);
        updateInfo();
    });

    //CLICK DERECOCHO PARA PEGAR PATRON
    canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault(); // Evita el menú contextual
        if(!patternSelect) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const [i, j] = canvasPos(x, y);
        const pattern = patterns[patternSelect.value];

        if(pattern) {
            pattern.forEach(([dx, dy]) => {
                const ni = i + dx - Math.floor(pattern.length / 2);
                const nj = j + dy - Math.floor(pattern.length / 2);

                if(ni >= 0 && ni < n && nj >= 0 && nj < n) {
                    world.matrix[ni][nj].alive = true;
                    world.matrix[ni][nj].timeAlive = 0;
                    world.playCellSound();
                }
            });

            draw();
            updateInfo();
        }
    });
    //BOTON COMENZAR
    startButton.addEventListener("click", () => {
        if(!timer) {
            //No se puede cambiar parametros mientras esta en marcha
            disableControls(true);
            //funcion del timer
            timer = setInterval(() => {
                world.updateMatrix();
                draw();
                totalTime += (1/fps);

                updateInfo();
            }, 
            //Intervalo en ms
            1000 / fps);
        }
    });   

    //BOTON DETENER
    stopButton.addEventListener("click", () => {
        if(timer) {
            clearInterval(timer);
            timer = null;

            disableControls(false);
        }
    });

    //BOTON CLEAR
    
    clearButton.addEventListener("click", () => {
        if(timer) return; //no se puede editar mientras esta en marcha
        world = new World(n);
        initCanvas();
        draw();

        totalTime = 0;
        updateInfo();
    });

    //BOTON APLICAR CAMBIOS
    applyButton.addEventListener("click", () => {
        if(timer) return; //no se puede editar mientras esta en marcha

        const newFps = parseInt(fpsInput.value);
        const newSize = parseInt(sizeInput.value);

        if((newFps >= 1 && newFps <= 60) && (newSize >= 10 && newSize <= 100)){
            fps = newFps;

            n = newSize;
            world = new World(n);
            totalTime = 0;
            initCanvas();
            draw();
        }
        else {
            alert("Valores inválidos. FPS debe estar entre 1 y 60. Tamaño debe estar entre 10 y 100.");
        }   
    });

    //INICIALIZACION
    initCanvas();
    draw();
    updateInfo();

});    
