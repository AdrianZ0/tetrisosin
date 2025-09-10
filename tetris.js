// Referencias a elementos HTML del DOM
const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');

// Configuracion del juego
const COLS = 10;  // Numero de columnas (10 celdas de ancho)
const ROWS = 20;  // Numero de filas (20 celdas de alto)

// piezas del tetris (Arrays 2D)
const SHAPES = [
    [[1, 1, 1, 1]],     // I (palito) - 1 fila, 4 columnas
    [[1, 1, 1], [0, 1, 0]], // T - 2 filas, 3 columnas
    [[1, 1, 1], [1, 0, 0]], // L - 2 filas, 3 columnas
    [[1, 1], [1, 1]]    // O (cuadrado) - 2 filas, 2 columnas
];

// Nombres de las clases CSS para cada tipo de pieza
const PIECE_CLASSES = ['piece-I', 'piece-T', 'piece-L', 'piece-O'];
// Estado del juego
let board = [];  // Array que representa lo visual del tetris
let cells = [];  // Referencias a las celdas del DOM
let score = 0;   // Puntuacion actual
let level = 1;   // Nivel actual
let currentPiece = null;  // Pieza actual en movimiento
let gameActive = false;   // Indica si el juego esta activo
let gameInterval = null;  // Intervalo del juego

// Funcion que se ejecuta cuando la pagina termina de cargar
function initGame() {
    createBoard(); // Crear el tablero lógico
    renderBoard(); // Crear el tablero visual
    setupEventListeners(); // Configurar eventos
}

// Crear el tablero (listas)
function createBoard() {
    board = []; // Inicializa el array del tablero
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];  // Crea un nuevo array para esta fila
        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0;  // 0 = celda vacía
        }
    }
}

// Creacion del juego visual (HTML)
function renderBoard() {
    gameBoard.innerHTML = '';  // Limpiar tetris del contenido que tenia antes
    cells = []; // Reiniciar Arrays como ref a celdas
    // Doble bucle para crear todas las celdas
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            // Crea elemento div para cada celda
            const cell = document.createElement('div');
            cell.className = 'cell'; // Asigna la clase CSS
            cell.dataset.row = row; // Guarda la fila como data attribute
            cell.dataset.col = col; // Guarda la columna como data attribute
            gameBoard.appendChild(cell);
            cells.push(cell);  // Guardar las celdas
        }
    }
}

// Actualizar la visualizacion del juego
function updateBoard() {
    // Recorre todo el tablero
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            // Calcula el indice lineal (fila * columnas + columna)
            const index = row * COLS + col;
            const cell = cells[index];
            // Limpiar clases anteriores
            cell.className = 'cell';
            // Si la celda tiene una pieza (valor > 0)
            if (board[row][col] > 0) {
                // Calcula el tipo de pieza (0-3) restando 1
                const pieceType = board[row][col] - 1;
                // Añade la clase CSS correspondiente al color
                cell.classList.add(PIECE_CLASSES[pieceType]);
            }
        }
    }
    // Dibujar la pieza actual si existe
    if (currentPiece) {
        drawCurrentPiece();
    }
}

// Dibujar la pieza actual en la caja del tetris
function drawCurrentPiece() {
    const { shape, type, x, y } = currentPiece;
    // Recorre el array de la pieza
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            // Si esta posicion de la pieza tiene un bloque (1)
            if (shape[row][col] === 1) {
                // Calcula la posicion del tablero de tetris
                const boardRow = y + row;
                const boardCol = x + col;
                // Verificar que este dentro del tablero
                if (boardRow >= 0 && boardRow < ROWS &&
                    boardCol >= 0 && boardCol < COLS) {
                    // Calcula el índice y obtiene la celda
                    const index = boardRow * COLS + boardCol;
                    const cell = cells[index];
                    // Añade la clase con el color correspondiente
                    cell.classList.add(PIECE_CLASSES[type]);
                }
            }
        }
    }
}

// Crear una nueva pieza aleatoria
function createPiece() {
    // Elige un tipo aleatorio (0-3)
    const type = Math.floor(Math.random() * SHAPES.length);
    // Retorna un objeto con toda la informacion de la pieza
    return {
        shape: SHAPES[type], // La forma del array
        type: type,  // El tipo (0-3)
        x: Math.floor(COLS / 2) - 1, // Posicion horizontal centrada
        y: 0 // Posicion vertical (arriba)
    };
}

// Verificar colisiones del juego (HITBOX)
function checkCollision(piece, offsetX = 0, offsetY = 0) {
    const { shape, x, y } = piece; // Extrae las propiedades de la pieza
    // Recorre toda la matriz de la pieza
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            // Si hay un bloque en esta posicion de la pieza
            if (shape[row][col] === 1) {
                // Calcula la nueva posicion con el offset
                const newX = x + col + offsetX;
                const newY = y + row + offsetY;
                // Comprobacion limites del tablero
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true; // Si hay Hitbox
                }
                // Verifica la hitbox con otras piezas
                if (newY >= 0 && board[newY][newX] > 0) {
                    return true; // si hay hitbox
                }
            }
        }
    }
    return false; // No hay hitbox
}

// Mover pieza horizontalmente
function movePiece(direction) {
    // Si el juego no está activo o no hay pieza, no hace nada
    if (!gameActive || !currentPiece) return;
    // Verifica si puede moverse en esa direccion sin golpear
    if (!checkCollision(currentPiece, direction, 0)) {
        currentPiece.x += direction; // Actualiza la posicion
        updateBoard(); // Redibuja el tablero de tetris
    }
}

// Rotar pieza
function rotatePiece() {
    if (!gameActive || !currentPiece) return;
    const originalShape = currentPiece.shape; // Guarda la forma original
    // Crear rotacion de la pieza
    const rotated = [];
    for (let col = 0; col < originalShape[0].length; col++) {
        rotated[col] = []; // Crea nueva columna
        // Rota transponiendo e invirtiendo el orden de las filas
        for (let row = originalShape.length - 1; row >= 0; row--) {
            rotated[col].push(originalShape[row][col]);
        }
    }
    // Intentar rotacion
    const originalRotation = currentPiece.shape;
    currentPiece.shape = rotated;
    // Si hay una colision, revertir
    if (checkCollision(currentPiece)) {
        currentPiece.shape = originalRotation;
    }
    updateBoard(); // Actualiza la visualizacion
}

// Bajar pieza una posicion
function dropPiece() {
    if (!gameActive || !currentPiece) return;
    // Verifica si puede bajar la pieza
    if (!checkCollision(currentPiece, 0, 1)) {
        currentPiece.y++; // Baja la pieza
        updateBoard(); // Actualiza el tablero
    } else {
        // Pieza ha llegado al fondo del tablero
        mergePiece(); // Lo une con el tablero
        clearLines(); // Elimina lineas completas
        spawnNewPiece(); // Genera una nueva pieza
    }
}

// Unir la pieza con el tablero
function mergePiece() {
    const { shape, type, x, y } = currentPiece;
    // Recorre el array de la pieza
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] === 1) {
                const boardY = y + row;
                const boardX = x + col;
                // Solo si esta dentro del tablero visible
                if (boardY >= 0) {
                    // Guarda el tipo + 1 (para que 0 sea vacío)
                    board[boardY][boardX] = type + 1;
                }
            }
        }
    }
}

// Eliminar lineas completas que haga el jugador con las piezas
function clearLines() {
    let linesCleared = 0; // Contador de lineas eliminadas
    for (let row = ROWS - 1; row >= 0; row--) {
        // Verificar si la linea esta formada
        if (board[row].every(cell => cell > 0)) {
            // Eliminar linea
            board.splice(row, 1);
            // Añadir nueva linea vacia al principio
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++; // Revisar la misma posicion otra vez
        }
    }
    // Actualizar puntuacion del jugador
    if (linesCleared > 0) {
        score += linesCleared * 100; // 100 puntos por línea
        scoreElement.textContent = score;
        // Aumentar nivel cada 500 puntos
        if (score >= level * 500) {
            level++;
            levelElement.textContent = level;
            updateGameSpeed(); // Aumenta la velocidad del tetris
        }
    }
}

// Actualizar velocidad del juego segun el nivel
function updateGameSpeed() {
    // Limpia el intervalo anterior si existe
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    // Calcula nueva velocidad, mas rapido cada nivel
    const speed = Math.max(100, 1000 - (level - 1) * 100);
    gameInterval = setInterval(gameLoop, speed);
}

// Generar nueva pieza
function spawnNewPiece() {
    currentPiece = createPiece(); // Crea nueva pieza
    // Verificar game over
    if (checkCollision(currentPiece)) {
        endGame(); // Termina funcion del juego
    }
    updateBoard(); // Actualiza la visualizacion
}

// Bucle principal del juego
function gameLoop() {
    if (gameActive) {
        dropPiece(); // Hace caer la pieza
    }
}

// Inicia un nuevo juego
function startGame() {
    if (gameActive) return; // Si ya está activo, no hace nada
    // Reinicia el estado del juego
    createBoard();
    score = 0;
    level = 1;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    gameActive = true;
    startBtn.textContent = "Iniciando juego...";
    startBtn.disabled = true;
    // Inicia la partida
    spawnNewPiece();
    updateGameSpeed();
}

// Reinicia el juego a estado inicial
function resetGame() {
    // Detiene el bucle del juego
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    gameActive = false;
    startBtn.textContent = "Iniciar";
    startBtn.disabled = false;
    // Limpia el tablero
    createBoard();
    updateBoard();
}

// Termina el juego
function endGame() {
    gameActive = false;
    // Detiene el bucle
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    // Muestra alerta con puntuación
    alert(`¡Perdiste! Record: ${score}`);
    startBtn.textContent = "Iniciar";
    startBtn.disabled = false;
}
// Configura todos los event listeners
function setupEventListeners() {
    // Eventos de teclado
    document.addEventListener('keydown', (e) => {
        if (!gameActive) return; // Ignora si juego no activo
        switch(e.key) {
            case 'ArrowLeft':
                movePiece(-1); // Mueve izquierda
                break;
            case 'ArrowRight':
                movePiece(1);  // Mueve derecha
                break;
            case 'ArrowDown':
                dropPiece();   // Baja mas rapido
                break;
            case 'ArrowUp':
                rotatePiece(); // Rota la pieza
                break;
            case ' ':
                // Caida instantanea - baja hasta el fondo
                while (!checkCollision(currentPiece, 0, 1)) {
                    currentPiece.y++;
                }
                dropPiece(); // Forza la hitbox final
                break;
        }
    });
    // Eventos de botones
    startBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
}
window.addEventListener('load', initGame);