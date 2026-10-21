import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Clock } from 'lucide-react';
import { PlayerAvatar } from '@/src/components/shared/PlayerAvatar';
import { RoomPlayerState, SnakeArenaView, SnakeDirection, SnakeMatchView } from '@/src/types/platform';
import { cn } from '@/src/utils/cn';

interface SnakeArenaProps {
  state: SnakeMatchView;
  players: RoomPlayerState[];
  currentUserId: string;
  onDirectionInput: (direction: SnakeDirection) => void;
}

function ArenaCanvas({
  arena,
  gridSize,
  headHex,
  bodyHex,
}: {
  arena: SnakeArenaView;
  gridSize: number;
  headHex: string;
  bodyHex: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const cell = size / gridSize;

    // Warm cream background
    ctx.fillStyle = '#FFF7ED';
    ctx.fillRect(0, 0, size, size);

    // Subtle pastel checkerboard / hairline grid
    ctx.strokeStyle = '#EFE3D5';
    ctx.lineWidth = 1;
    for (let i = 1; i < gridSize; i++) {
      const pos = i * cell;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
    }

    // Cartoon Apple Food with dark plum outline & leaf
    const fcx = arena.food.x * cell + cell / 2;
    const fcy = arena.food.y * cell + cell / 2 + 1;
    const radius = Math.max(5, cell * 0.36);

    ctx.fillStyle = '#FF8E9E';
    ctx.strokeStyle = '#3D3045';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(fcx, fcy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Little green stem/leaf
    ctx.strokeStyle = '#53C99A';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fcx, fcy - radius);
    ctx.quadraticCurveTo(fcx + 4, fcy - radius - 5, fcx + 7, fcy - radius - 2);
    ctx.stroke();

    // Snake segments (draw tail to head so head sits cleanly on top)
    for (let idx = arena.snake.length - 1; idx >= 0; idx--) {
      const seg = arena.snake[idx];
      const sx = seg.x * cell;
      const sy = seg.y * cell;
      const isHead = idx === 0;

      ctx.fillStyle = !arena.alive
        ? isHead
          ? '#817487'
          : '#D4C7B9'
        : isHead
          ? headHex
          : bodyHex;

      ctx.strokeStyle = '#3D3045';
      ctx.lineWidth = isHead ? 2.2 : 1.5;

      ctx.beginPath();
      ctx.roundRect(sx + 1.5, sy + 1.5, cell - 3, cell - 3, isHead ? 6 : 5);
      ctx.fill();
      ctx.stroke();

      // Cute eyes on head
      if (isHead && arena.alive) {
        const eyeOffset = cell * 0.24;
        let ex1 = sx + cell * 0.65;
        let ey1 = sy + cell * 0.32;
        let ex2 = sx + cell * 0.65;
        let ey2 = sy + cell * 0.68;

        if (arena.direction === 'LEFT') {
          ex1 = sx + cell * 0.35;
          ex2 = sx + cell * 0.35;
        } else if (arena.direction === 'UP') {
          ex1 = sx + cell * 0.32;
          ey1 = sy + cell * 0.35;
          ex2 = sx + cell * 0.68;
          ey2 = sy + cell * 0.35;
        } else if (arena.direction === 'DOWN') {
          ex1 = sx + cell * 0.32;
          ey1 = sy + cell * 0.65;
          ex2 = sx + cell * 0.68;
          ey2 = sy + cell * 0.65;
        }

        const eyeR = Math.max(2, eyeOffset * 0.55);
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex1, ey1, eyeR, 0, Math.PI * 2);
        ctx.arc(ex2, ey2, eyeR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3D3045';
        ctx.beginPath();
        ctx.arc(ex1, ey1, eyeR * 0.5, 0, Math.PI * 2);
        ctx.arc(ex2, ey2, eyeR * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [arena, gridSize, headHex, bodyHex]);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-3xl border-2 border-[#3D3045] bg-[#FFF7ED] shadow-[0_6px_0_#3D3045]">
      <canvas ref={canvasRef} width={400} height={400} className="block h-full w-full" />
      {!arena.alive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FFF7ED]/90 p-4 text-center">
          <div className="rounded-2xl border-2 border-[#3D3045] bg-white px-5 py-4 shadow-[0_4px_0_#3D3045]">
            <div className="font-display text-xl font-black text-[#3D3045]">
              {arena.deathReason === 'timeout' ? 'Time Up!' : 'Bonk! Crashed'}
            </div>
            <p className="mt-1 text-xs font-bold text-[#817487]">
              {arena.deathReason === 'wall'
                ? 'Bumped into the arena wall'
                : arena.deathReason === 'self'
                  ? 'Tangled into own tail'
                  : arena.deathReason === 'disconnect'
                    ? 'Player disconnected'
                    : 'Match timer finished'}
            </p>
            <div className="mt-3 font-mono text-base tabular-nums font-bold text-[#9B7BFF]">
              Final Score: {arena.score}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SnakeArena({
  state,
  players,
  currentUserId,
  onDirectionInput,
}: SnakeArenaProps) {
  const [mobileView, setMobileView] = useState<'mine' | 'opponent'>('mine');
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const me = players.find((p) => p.userId === currentUserId) ?? players[0];
  const opponent = players.find((p) => p.userId !== me.userId) ?? players[1];

  const myArena = state.arenas[me.userId];
  const oppArena = state.arenas[opponent.userId];

  const remainingSeconds = Math.ceil(state.remainingMs / 1000);
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedTimer = `${mins}:${String(secs).padStart(2, '0')}`;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let dir: SnakeDirection | null = null;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dir = 'UP';
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dir = 'DOWN';
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dir = 'LEFT';
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dir = 'RIGHT';

      if (dir) {
        e.preventDefault();
        onDirectionInput(dir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDirectionInput]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      onDirectionInput(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      onDirectionInput(dy > 0 ? 'DOWN' : 'UP');
    }
  };

  const renderPlayerHeader = (player: RoomPlayerState, arena: SnakeArenaView, isMine: boolean) => (
    <div
      className={cn(
        'mb-3 flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3',
        isMine
          ? 'border-[#3D3045] bg-[#E3F8F0] shadow-[0_3px_0_#3D3045]'
          : 'border-[#E9DCCF] bg-white'
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <PlayerAvatar
          avatar={player.avatar}
          username={player.username}
          status={player.connected ? 'online' : 'offline'}
          size="sm"
          showStatusDot
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold text-[#3D3045]">
            {player.username} {isMine ? '(You)' : ''}
          </div>
          <div className="text-xs font-bold text-[#817487]">
            {arena.alive ? 'Active' : 'Finished'} · Length {arena.snake.length}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-[11px] font-bold text-[#817487]">Score</div>
        <div className="font-mono text-xl font-bold tabular-nums text-[#3D3045]">
          {arena.score}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Persistent Top HUD */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-[#3D3045] bg-white px-5 py-3.5 shadow-[0_4px_0_#E9DCCF]">
        <div className="flex items-center gap-4 text-sm font-bold">
          <div>
            <span className="text-[#817487]">{me.username}: </span>
            <span className="font-mono font-bold tabular-nums text-[#53C99A]">
              {myArena?.score ?? 0}
            </span>
          </div>
          <span className="text-[#E9DCCF]" aria-hidden="true">
            ·
          </span>
          <div>
            <span className="text-[#817487]">{opponent.username}: </span>
            <span className="font-mono font-bold tabular-nums text-[#9B7BFF]">
              {oppArena?.score ?? 0}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border-2 border-[#3D3045] bg-[#FFD166] px-3 py-1 font-mono text-base font-bold tabular-nums text-[#3D3045]">
          <Clock className="h-4 w-4" />
          <span>{formattedTimer}</span>
        </div>
      </div>

      {myArena && oppArena && !myArena.alive && oppArena.alive && (
        <div className="rounded-2xl border-2 border-[#3D3045] bg-[#FFF5D6] px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-[#3D3045]">
          Your run ended at {myArena.score} pts. Watching {opponent.username} finish!
        </div>
      )}

      {/* DESKTOP: Side-by-Side Dual Arenas */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8">
        <div>
          {myArena && renderPlayerHeader(me, myArena, true)}
          {myArena && (
            <ArenaCanvas
              arena={myArena}
              gridSize={state.gridSize}
              headHex="#53C99A"
              bodyHex="#8BDCC0"
            />
          )}
          <p className="mt-3 text-center text-xs font-bold text-[#817487]">
            Controls: Arrow Keys or W A S D
          </p>
        </div>

        <div>
          {oppArena && renderPlayerHeader(opponent, oppArena, false)}
          {oppArena && (
            <ArenaCanvas
              arena={oppArena}
              gridSize={state.gridSize}
              headHex="#9B7BFF"
              bodyHex="#C4B1FF"
            />
          )}
          <p className="mt-3 text-center text-xs font-bold text-[#817487]">
            Opponent live feed
          </p>
        </div>
      </div>

      {/* MOBILE: Toggleable Single Arena + Touch Controls */}
      <div className="lg:hidden space-y-4">
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl border-2 border-[#E9DCCF] bg-[#FFF0DF] p-1.5">
          <button
            type="button"
            onClick={() => setMobileView('mine')}
            className={cn(
              'rounded-xl py-2 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap',
              mobileView === 'mine'
                ? 'bg-[#53C99A] text-white border-2 border-[#3D3045]'
                : 'text-[#817487] hover:text-[#3D3045]'
            )}
          >
            My Game ({myArena?.score ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setMobileView('opponent')}
            className={cn(
              'rounded-xl py-2 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap',
              mobileView === 'opponent'
                ? 'bg-[#9B7BFF] text-white border-2 border-[#3D3045]'
                : 'text-[#817487] hover:text-[#3D3045]'
            )}
          >
            Opponent ({oppArena?.score ?? 0})
          </button>
        </div>

        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {mobileView === 'mine' && myArena && (
            <>
              {renderPlayerHeader(me, myArena, true)}
              <ArenaCanvas
                arena={myArena}
                gridSize={state.gridSize}
                headHex="#53C99A"
                bodyHex="#8BDCC0"
              />
            </>
          )}
          {mobileView === 'opponent' && oppArena && (
            <>
              {renderPlayerHeader(opponent, oppArena, false)}
              <ArenaCanvas
                arena={oppArena}
                gridSize={state.gridSize}
                headHex="#9B7BFF"
                bodyHex="#C4B1FF"
              />
            </>
          )}
        </div>

        {mobileView === 'mine' && (
          <div className="mx-auto grid w-52 grid-cols-3 gap-2.5 pt-1">
            <div />
            <button
              type="button"
              onClick={() => onDirectionInput('UP')}
              aria-label="Move Up"
              className="flex h-12 items-center justify-center rounded-2xl border-2 border-[#3D3045] border-b-4 bg-white text-[#3D3045] active:translate-y-0.5 active:border-b-2 active:bg-[#8BDCC0]"
            >
              <ArrowUp className="h-5 w-5 stroke-[2.5]" />
            </button>
            <div />
            <button
              type="button"
              onClick={() => onDirectionInput('LEFT')}
              aria-label="Move Left"
              className="flex h-12 items-center justify-center rounded-2xl border-2 border-[#3D3045] border-b-4 bg-white text-[#3D3045] active:translate-y-0.5 active:border-b-2 active:bg-[#8BDCC0]"
            >
              <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => onDirectionInput('DOWN')}
              aria-label="Move Down"
              className="flex h-12 items-center justify-center rounded-2xl border-2 border-[#3D3045] border-b-4 bg-white text-[#3D3045] active:translate-y-0.5 active:border-b-2 active:bg-[#8BDCC0]"
            >
              <ArrowDown className="h-5 w-5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => onDirectionInput('RIGHT')}
              aria-label="Move Right"
              className="flex h-12 items-center justify-center rounded-2xl border-2 border-[#3D3045] border-b-4 bg-white text-[#3D3045] active:translate-y-0.5 active:border-b-2 active:bg-[#8BDCC0]"
            >
              <ArrowRight className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
