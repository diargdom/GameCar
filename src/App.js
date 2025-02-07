import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Text, Image } from "react-konva";
import useImage from "use-image";

// Cargar imágenes de los carros
const CarImage = ({ src, x, y, width, height }) => {
  const [image] = useImage(src);
  return <Image x={x} y={y} width={width} height={height} image={image} />;
};

const App = () => {
  const [playerX, setPlayerX] = useState(250);
  const [playerY, setPlayerY] = useState(400);
  const [obstacles, setObstacles] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState(null); // Estado para la dificultad
  const gameLoopRef = useRef(null);

  // Configuración de la dificultad
  const difficultySettings = {
    easy: { speed: 3, spawnInterval: 1500 },
    medium: { speed: 5, spawnInterval: 1000 },
    hard: { speed: 7, spawnInterval: 750 },
    brutal: { speed: 10, spawnInterval: 500 },
  };

  // Mover el carro del jugador con las teclas
  const handleKeyDown = (e) => {
    if (gameOver || !difficulty) return; // No mover si el juego terminó o no se ha seleccionado la dificultad
    const step = 10;
    switch (e.key) {
      case "ArrowLeft":
      case "a":
        setPlayerX((prevX) => Math.max(100, prevX - step)); // Límite izquierdo de la carretera
        break;
      case "ArrowRight":
      case "d":
        setPlayerX((prevX) => Math.min(370, prevX + step)); // Límite derecho de la carretera
        break;
      case "ArrowUp":
      case "w":
        setPlayerY((prevY) => Math.max(0, prevY - step));
        break;
      case "ArrowDown":
      case "s":
        setPlayerY((prevY) => Math.min(450, prevY + step));
        break;
      default:
        break;
    }
  };

  // Detectar colisiones
  const checkCollision = (playerX, playerY, obstacle) => {
    return (
      playerX < obstacle.x + 30 &&
      playerX + 30 > obstacle.x &&
      playerY < obstacle.y + 50 &&
      playerY + 50 > obstacle.y
    );
  };

  // Lógica del juego
  useEffect(() => {
    if (gameOver || !difficulty) return;

    const { speed, spawnInterval } = difficultySettings[difficulty];

    // Generar obstáculos
    const obstacleInterval = setInterval(() => {
      setObstacles((prevObstacles) => [
        ...prevObstacles,
        {
          x: 100 + Math.random() * 280, // Asegurar que los obstáculos aparezcan dentro de la carretera
          y: -50,
          id: Math.random(),
        },
      ]);
    }, spawnInterval);

    // Mover obstáculos
    gameLoopRef.current = setInterval(() => {
      setObstacles((prevObstacles) =>
        prevObstacles
          .map((obstacle) => ({
            ...obstacle,
            y: obstacle.y + speed,
          }))
          .filter((obstacle) => {
            if (obstacle.y > 500) {
              // Si el obstáculo sale de la pantalla, incrementar el score
              setScore((prevScore) => prevScore + 1);
              return false; // Eliminar el obstáculo
            }
            return true;
          })
      );
    }, 50);

    return () => {
      clearInterval(obstacleInterval);
      clearInterval(gameLoopRef.current);
    };
  }, [gameOver, difficulty]);

  // Verificar colisiones en cada frame
  useEffect(() => {
    if (gameOver || !difficulty) return;

    const collision = obstacles.some((obstacle) =>
      checkCollision(playerX, playerY, obstacle)
    );

    if (collision) {
      setGameOver(true);
      clearInterval(gameLoopRef.current);
    }
  }, [obstacles, playerX, playerY, gameOver, difficulty]);

  // Reiniciar el juego
  const restartGame = () => {
    setPlayerX(250);
    setPlayerY(400);
    setObstacles([]);
    setGameOver(false);
    setScore(0);
    setDifficulty(null); // Volver al menú de dificultad
  };

  // Escuchar eventos de teclado
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameOver, difficulty]);

  // Crear un array de posiciones para las líneas de la carretera
  const roadLines = [...Array(10).keys()]; // Array de 10 elementos para las líneas de la carretera

  return (
    <Stage width={500} height={500}>
      <Layer>
        {/* Fondo de la carretera */}
        <Rect x={0} y={0} width={500} height={500} fill="gray" />
        <Rect x={100} y={0} width={300} height={500} fill="black" />
        <Rect x={110} y={0} width={280} height={500} fill="darkgray" />

        {/* Líneas de la carretera */}
        {roadLines.map((_, i) => (
          <Rect
            key={i}
            x={245}
            y={i * 50}
            width={10}
            height={30}
            fill="yellow"
          />
        ))}

        {/* Mostrar el score en la parte superior izquierda */}
        <Text
          x={10}
          y={10}
          text={`Score: ${score}`}
          fontSize={20}
          fill="white"
        />

        {/* Carro del jugador */}
        <CarImage
          src="https://cdn.iconscout.com/icon/premium/png-256-thumb/vista-superior-del-coche-7355712-6071962.png?f=webp&w=256" // URL de la imagen del carro azul
          x={playerX}
          y={playerY}
          width={50}
          height={50}
        />

        {/* Obstáculos */}
        {obstacles.map((obstacle) => (
          <CarImage
            key={obstacle.id}
            src="https://cdn-icons-png.flaticon.com/512/744/744515.png" // URL de la imagen del carro rojo
            x={obstacle.x}
            y={obstacle.y}
            width={50}
            height={50}
          />
        ))}

        {/* Pantalla de Game Over */}
        {gameOver && (
          <>
            <Rect
              x={0}
              y={0}
              width={500}
              height={500}
              fill="rgba(0, 0, 0, 0.7)"
            />
            <Text
              x={150}
              y={200}
              text="Game Over"
              fontSize={40}
              fill="red"
              fontStyle="bold"
            />
            <Text
              x={180}
              y={250}
              text={`Score: ${score}`}
              fontSize={30}
              fill="white"
            />
            <Text
              x={150}
              y={300}
              text="Click to Restart"
              fontSize={20}
              fill="white"
              onClick={restartGame}
            />
          </>
        )}

        {/* Menú de selección de dificultad */}
        {!difficulty && (
          <>
            <Rect
              x={0}
              y={0}
              width={500}
              height={500}
              fill="rgba(0, 0, 0, 0.7)"
            />
            <Text
              x={150}
              y={100}
              text="Selecciona la dificultad"
              fontSize={30}
              fill="white"
            />
            {Object.keys(difficultySettings).map((diff, i) => (
              <Text
                key={diff}
                x={150}
                y={150 + i * 50}
                text={diff.charAt(0).toUpperCase() + diff.slice(1)}
                fontSize={25}
                fill="white"
                onClick={() => setDifficulty(diff)}
              />
            ))}
          </>
        )}
      </Layer>
    </Stage>
  );
};

export default App;
