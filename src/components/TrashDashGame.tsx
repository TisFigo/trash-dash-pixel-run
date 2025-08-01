import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Heart } from 'lucide-react';

interface GameObject {
  id: number;
  x: number;
  y: number;
  type: 'bottle' | 'can' | 'bag' | 'paper';
  speed: number;
}

const TrashDashGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const [gameState, setGameState] = useState<'playing' | 'gameOver' | 'ready'>('ready');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const gameObjectsRef = useRef<GameObject[]>([]);
  const nextIdRef = useRef(1);
  const lastSpawnRef = useRef(0);
  const gameStartTimeRef = useRef(0);

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;
  const BASE_SPAWN_RATE = 1500; // Base spawn rate in milliseconds
  const MIN_SPAWN_RATE = 400; // Minimum spawn rate (maximum difficulty)
  const BASE_SPEED = 1;
  const MAX_SPEED_MULTIPLIER = 3;

  // Trash types with larger sizes and colors
  const trashTypes = {
    bottle: { color: '#4ade80', width: 24, height: 48 },
    can: { color: '#f59e0b', width: 30, height: 36 },
    bag: { color: '#374151', width: 36, height: 30 },
    paper: { color: '#e5e7eb', width: 27, height: 27 }
  };

  // Calculate difficulty based on time elapsed
  const getDifficultyMultiplier = () => {
    if (gameState !== 'playing') return 1;
    const timeElapsed = Date.now() - gameStartTimeRef.current;
    const seconds = timeElapsed / 1000;
    // Gradually increase difficulty over 120 seconds
    return Math.min(1 + (seconds / 120) * (MAX_SPEED_MULTIPLIER - 1), MAX_SPEED_MULTIPLIER);
  };

  const getCurrentSpawnRate = () => {
    const difficultyMultiplier = getDifficultyMultiplier();
    // Decrease spawn rate (faster spawning) as difficulty increases
    return Math.max(BASE_SPAWN_RATE / difficultyMultiplier, MIN_SPAWN_RATE);
  };

  const drawPixelTrash = (ctx: CanvasRenderingContext2D, obj: GameObject) => {
    const trash = trashTypes[obj.type];
    ctx.fillStyle = trash.color;
    
    // Draw pixelated trash with simple shapes
    ctx.fillRect(obj.x, obj.y, trash.width, trash.height);
    
    // Add pixel details (scaled proportionally)
    ctx.fillStyle = '#000000';
    if (obj.type === 'bottle') {
      ctx.fillRect(obj.x + 9, obj.y - 6, 6, 12); // bottle neck
      ctx.fillRect(obj.x + 6, obj.y + 12, 12, 3); // label
    } else if (obj.type === 'can') {
      ctx.fillRect(obj.x + 3, obj.y + 6, 24, 3); // can line
      ctx.fillRect(obj.x + 3, obj.y + 18, 24, 3); // can line
    } else if (obj.type === 'bag') {
      ctx.fillRect(obj.x + 6, obj.y + 6, 6, 6); // bag handle
      ctx.fillRect(obj.x + 24, obj.y + 6, 6, 6); // bag handle
    }
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(1, '#98fb98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Pixelated clouds
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) {
      const x = (i * 120) + 40;
      const y = 50 + (i * 30);
      ctx.fillRect(x, y, 32, 16);
      ctx.fillRect(x + 8, y - 8, 16, 8);
      ctx.fillRect(x + 16, y + 16, 16, 8);
    }

    // Ground
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);
    
    // Road
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);
    
    // Road lines
    ctx.fillStyle = '#fbbf24';
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      ctx.fillRect(i, CANVAS_HEIGHT - 22, 20, 4);
    }
  };

  const spawnTrash = useCallback(() => {
    const types: (keyof typeof trashTypes)[] = ['bottle', 'can', 'bag', 'paper'];
    const type = types[Math.floor(Math.random() * types.length)];
    const difficultyMultiplier = getDifficultyMultiplier();
    
    const newTrash: GameObject = {
      id: nextIdRef.current++,
      x: Math.random() * (CANVAS_WIDTH - 40),
      y: -60,
      type,
      speed: (BASE_SPEED + Math.random() * 1) * difficultyMultiplier
    };
    
    gameObjectsRef.current = [...gameObjectsRef.current, newTrash];
    setGameObjects([...gameObjectsRef.current]);
  }, []);

  const updateGame = useCallback(() => {
    if (gameState !== 'playing') return;

    const now = Date.now();
    const currentSpawnRate = getCurrentSpawnRate();
    
    // Spawn new trash with dynamic rate
    if (now - lastSpawnRef.current > currentSpawnRate) {
      spawnTrash();
      lastSpawnRef.current = now;
    }

    // Update positions
    gameObjectsRef.current = gameObjectsRef.current.map(obj => ({
      ...obj,
      y: obj.y + obj.speed
    }));

    // Remove objects that fell off screen and decrease lives
    const beforeCount = gameObjectsRef.current.length;
    gameObjectsRef.current = gameObjectsRef.current.filter(obj => {
      if (obj.y > CANVAS_HEIGHT) {
        setLives(prev => prev - 1);
        return false;
      }
      return true;
    });
    
    setGameObjects([...gameObjectsRef.current]);
  }, [gameState, spawnTrash]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Disable smoothing for pixel art
    ctx.imageSmoothingEnabled = false;
    
    // Clear and draw background
    drawBackground(ctx);

    // Draw trash
    gameObjectsRef.current.forEach(obj => {
      drawPixelTrash(ctx, obj);
    });

    // Draw UI
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 30);
    
    // Draw hearts for lives
    const heartSize = 20;
    for (let i = 0; i < lives; i++) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(CANVAS_WIDTH - 30 - (i * 25), 10, heartSize, heartSize);
    }
  }, [score, lives]);

  const gameLoop = useCallback(() => {
    updateGame();
    render();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [updateGame, render]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    // Handle both mouse and touch events
    if ('touches' in event) {
      const touch = event.touches[0] || event.changedTouches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }

    // Adjust for canvas scaling on mobile
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    x *= scaleX;
    y *= scaleY;

    // Check if click/touch hit any trash
    gameObjectsRef.current = gameObjectsRef.current.filter(obj => {
      const trash = trashTypes[obj.type];
      if (x >= obj.x && x <= obj.x + trash.width &&
          y >= obj.y && y <= obj.y + trash.height) {
        setScore(prev => prev + 10);
        return false; // Remove the clicked trash
      }
      return true;
    });
    
    setGameObjects([...gameObjectsRef.current]);
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(5);
    setGameObjects([]);
    gameObjectsRef.current = [];
    nextIdRef.current = 1;
    lastSpawnRef.current = Date.now();
    gameStartTimeRef.current = Date.now();
  };

  const resetGame = () => {
    setGameState('ready');
    setScore(0);
    setLives(5);
    setGameObjects([]);
    gameObjectsRef.current = [];
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
  };

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    if (lives <= 0 && gameState === 'playing') {
      setGameState('gameOver');
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }
  }, [lives, gameState]);

  const currentDifficulty = getDifficultyMultiplier();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-400 to-green-400 p-2 sm:p-4">
      <div className="relative max-w-full">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleClick}
          onTouchStart={handleClick}
          onTouchEnd={(e) => e.preventDefault()}
          className="border-4 border-gray-800 rounded-lg shadow-2xl cursor-pointer touch-none max-w-full h-auto"
          style={{ 
            imageRendering: 'pixelated',
            maxWidth: '100vw',
            maxHeight: '70vh'
          }}
        />
        
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center text-white rounded-lg p-4">
            <h1 className="text-2xl sm:text-4xl font-bold mb-4 text-center pixel-font">TRASH DASH</h1>
            <p className="text-sm sm:text-lg mb-2 text-center">Tap/Click the falling garbage!</p>
            <p className="text-xs sm:text-sm mb-4 text-center">Don't let more than 5 pieces fall!</p>
            <p className="text-xs sm:text-sm mb-6 text-center text-yellow-300">Speed increases over time!</p>
            <Button onClick={startGame} className="bg-green-500 hover:bg-green-600 text-lg sm:text-xl px-6 sm:px-8 py-2 sm:py-3">
              START GAME
            </Button>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center text-white rounded-lg p-4">
            <h1 className="text-2xl sm:text-4xl font-bold mb-4 text-red-400">GAME OVER</h1>
            <p className="text-lg sm:text-2xl mb-2">Final Score: {score}</p>
            <p className="text-sm sm:text-lg mb-6">Too much trash hit the ground!</p>
            <Button onClick={resetGame} className="bg-blue-500 hover:bg-blue-600 text-lg sm:text-xl px-6 sm:px-8 py-2 sm:py-3">
              <RotateCcw className="mr-2" size={20} />
              PLAY AGAIN
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 sm:mt-6 text-center px-2">
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg sm:text-xl">Score: {score}</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="text-red-500" size={20} />
            <span className="text-white font-bold text-lg sm:text-xl">Lives: {lives}</span>
          </div>
          {gameState === 'playing' && (
            <div className="flex items-center gap-2">
              <span className="text-yellow-300 font-bold text-sm sm:text-lg">
                Speed: {currentDifficulty.toFixed(1)}x
              </span>
            </div>
          )}
        </div>
        <p className="text-white text-xs sm:text-sm opacity-75">
          Tap/Click on the falling trash to collect it before it hits the ground!
        </p>
      </div>
    </div>
  );
};

export default TrashDashGame;
