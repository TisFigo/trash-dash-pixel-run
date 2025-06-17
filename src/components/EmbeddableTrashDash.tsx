
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

const EmbeddableTrashDash = () => {
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

  const CANVAS_WIDTH = 320;
  const CANVAS_HEIGHT = 480;
  const BASE_SPAWN_RATE = 1500;
  const MIN_SPAWN_RATE = 400;
  const BASE_SPEED = 1;
  const MAX_SPEED_MULTIPLIER = 3;

  const trashTypes = {
    bottle: { color: '#4ade80', width: 24, height: 48 },
    can: { color: '#f59e0b', width: 30, height: 36 },
    bag: { color: '#374151', width: 36, height: 30 },
    paper: { color: '#e5e7eb', width: 27, height: 27 }
  };

  const getDifficultyMultiplier = () => {
    if (gameState !== 'playing') return 1;
    const timeElapsed = Date.now() - gameStartTimeRef.current;
    const seconds = timeElapsed / 1000;
    return Math.min(1 + (seconds / 120) * (MAX_SPEED_MULTIPLIER - 1), MAX_SPEED_MULTIPLIER);
  };

  const getCurrentSpawnRate = () => {
    const difficultyMultiplier = getDifficultyMultiplier();
    return Math.max(BASE_SPAWN_RATE / difficultyMultiplier, MIN_SPAWN_RATE);
  };

  const drawPixelTrash = (ctx: CanvasRenderingContext2D, obj: GameObject) => {
    const trash = trashTypes[obj.type];
    ctx.fillStyle = trash.color;
    
    ctx.fillRect(obj.x, obj.y, trash.width, trash.height);
    
    ctx.fillStyle = '#000000';
    if (obj.type === 'bottle') {
      ctx.fillRect(obj.x + 9, obj.y - 6, 6, 12);
      ctx.fillRect(obj.x + 6, obj.y + 12, 12, 3);
    } else if (obj.type === 'can') {
      ctx.fillRect(obj.x + 3, obj.y + 6, 24, 3);
      ctx.fillRect(obj.x + 3, obj.y + 18, 24, 3);
    } else if (obj.type === 'bag') {
      ctx.fillRect(obj.x + 6, obj.y + 6, 6, 6);
      ctx.fillRect(obj.x + 24, obj.y + 6, 6, 6);
    }
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(1, '#98fb98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 2; i++) {
      const x = (i * 100) + 30;
      const y = 40 + (i * 25);
      ctx.fillRect(x, y, 24, 12);
      ctx.fillRect(x + 6, y - 6, 12, 6);
      ctx.fillRect(x + 12, y + 12, 12, 6);
    }

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
    
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 30);
    
    ctx.fillStyle = '#fbbf24';
    for (let i = 0; i < CANVAS_WIDTH; i += 30) {
      ctx.fillRect(i, CANVAS_HEIGHT - 18, 15, 3);
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
    
    if (now - lastSpawnRef.current > currentSpawnRate) {
      spawnTrash();
      lastSpawnRef.current = now;
    }

    gameObjectsRef.current = gameObjectsRef.current.map(obj => ({
      ...obj,
      y: obj.y + obj.speed
    }));

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

    ctx.imageSmoothingEnabled = false;
    
    drawBackground(ctx);

    gameObjectsRef.current.forEach(obj => {
      drawPixelTrash(ctx, obj);
    });

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText(`Score: ${score}`, 8, 20);
    
    const heartSize = 12;
    for (let i = 0; i < lives; i++) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(CANVAS_WIDTH - 20 - (i * 16), 8, heartSize, heartSize);
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

    if ('touches' in event) {
      const touch = event.touches[0] || event.changedTouches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }

    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    x *= scaleX;
    y *= scaleY;

    gameObjectsRef.current = gameObjectsRef.current.filter(obj => {
      const trash = trashTypes[obj.type];
      if (x >= obj.x && x <= obj.x + trash.width &&
          y >= obj.y && y <= obj.y + trash.height) {
        setScore(prev => prev + 10);
        return false;
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
    <div className="inline-block bg-gradient-to-b from-blue-400 to-green-400 p-4 rounded-lg shadow-lg">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleClick}
          onTouchStart={handleClick}
          onTouchEnd={(e) => e.preventDefault()}
          className="border-2 border-gray-800 rounded cursor-pointer touch-none"
          style={{ 
            imageRendering: 'pixelated',
            display: 'block'
          }}
        />
        
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center text-white rounded">
            <h1 className="text-xl font-bold mb-2 pixel-font">TRASH DASH</h1>
            <p className="text-xs mb-1 text-center">Click the falling garbage!</p>
            <p className="text-xs mb-3 text-center">Don't let 5+ pieces fall!</p>
            <Button onClick={startGame} className="bg-green-500 hover:bg-green-600 text-sm px-4 py-2">
              START
            </Button>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center text-white rounded">
            <h1 className="text-xl font-bold mb-2 text-red-400">GAME OVER</h1>
            <p className="text-sm mb-1">Score: {score}</p>
            <p className="text-xs mb-3">Too much trash fell!</p>
            <Button onClick={resetGame} className="bg-blue-500 hover:bg-blue-600 text-sm px-4 py-2">
              <RotateCcw className="mr-1" size={14} />
              RETRY
            </Button>
          </div>
        )}
      </div>

      <div className="mt-2 text-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          <span className="text-white font-bold text-sm">Score: {score}</span>
          <div className="flex items-center gap-1">
            <Heart className="text-red-500" size={14} />
            <span className="text-white font-bold text-sm">{lives}</span>
          </div>
          {gameState === 'playing' && (
            <span className="text-yellow-300 font-bold text-xs">
              {currentDifficulty.toFixed(1)}x
            </span>
          )}
        </div>
        <p className="text-white text-xs opacity-75">
          Click/tap the falling trash!
        </p>
      </div>
    </div>
  );
};

export default EmbeddableTrashDash;
