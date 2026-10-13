import React from 'react';
import { Arrow, Direction } from '../types/game';
import { getDirectionAngle } from '../game/solver';

interface ArrowCellProps {
  arrow?: Arrow;
  cellSize: number;
  isEscaping?: boolean;
  isBlocked?: boolean;
  isHinted?: boolean;
  reducedMotion?: boolean;
  onClick: (arrow: Arrow) => void;
}

export const ArrowCell: React.FC<ArrowCellProps> = ({
  arrow,
  cellSize,
  isEscaping,
  isBlocked,
  isHinted,
  reducedMotion,
  onClick,
}) => {
  if (!arrow) {
    return (
      <div
        className="arrow-empty-cell w-full h-full rounded-xl transition-colors"
        aria-hidden="true"
      />
    );
  }

  const angle = getDirectionAngle(arrow.direction);

  // Directional translation vector for exit flight animation
  const getExitTransform = (dir: Direction): string => {
    if (reducedMotion) return 'scale(0.8) opacity(0)';
    switch (dir) {
      case 'UP': return 'translateY(-180%) scale(0.9) opacity(0)';
      case 'DOWN': return 'translateY(180%) scale(0.9) opacity(0)';
      case 'LEFT': return 'translateX(-180%) scale(0.9) opacity(0)';
      case 'RIGHT': return 'translateX(180%) scale(0.9) opacity(0)';
    }
  };

  // Bump animation class when blocked
  const getBlockedClass = (dir: Direction): string => {
    switch (dir) {
      case 'UP': return 'anim-bump-up';
      case 'DOWN': return 'anim-bump-down';
      case 'LEFT': return 'anim-bump-left';
      case 'RIGHT': return 'anim-bump-right';
    }
  };

  // Color schemes for arrow styling
  const getColorStyles = (variant?: Arrow['colorVariant']) => {
    switch (variant) {
      case 'cyan':
        return {
          bg: 'from-cyan-500/25 to-blue-600/30 border-cyan-400/40 hover:border-cyan-300',
          fill: '#38bdf8',
          glow: 'group-hover:shadow-[0_0_15px_rgba(56,189,248,0.35)]',
        };
      case 'amber':
        return {
          bg: 'from-amber-500/25 to-orange-600/30 border-amber-400/40 hover:border-amber-300',
          fill: '#fbbf24',
          glow: 'group-hover:shadow-[0_0_15px_rgba(251,191,36,0.35)]',
        };
      case 'indigo':
        return {
          bg: 'from-indigo-500/25 to-violet-600/30 border-indigo-400/40 hover:border-indigo-300',
          fill: '#818cf8',
          glow: 'group-hover:shadow-[0_0_15px_rgba(129,140,248,0.35)]',
        };
      case 'emerald':
        return {
          bg: 'from-emerald-500/25 to-teal-600/30 border-emerald-400/40 hover:border-emerald-300',
          fill: '#34d399',
          glow: 'group-hover:shadow-[0_0_15px_rgba(52,211,153,0.35)]',
        };
      case 'mint':
      default:
        return {
          bg: 'from-teal-500/25 to-cyan-600/30 border-teal-400/40 hover:border-teal-300',
          fill: '#2dd4bf',
          glow: 'group-hover:shadow-[0_0_15px_rgba(45,212,191,0.35)]',
        };
    }
  };

  const colors = getColorStyles(arrow.colorVariant);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-1">
      <button
        type="button"
        onClick={() => onClick(arrow)}
        disabled={isEscaping}
        aria-label={`Arrow pointing ${arrow.direction} at row ${arrow.row + 1}, column ${arrow.col + 1}`}
        className={`arrow-cell group relative w-full h-full rounded-2xl flex items-center justify-center cursor-pointer select-none
          border bg-gradient-to-b backdrop-blur-sm transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070d1d]
          active:scale-95
          ${colors.bg} ${colors.glow}
          ${isBlocked ? `${getBlockedClass(arrow.direction)} border-rose-500/70 bg-rose-950/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]` : ''}
          ${isHinted ? 'hint-active border-amber-300 bg-amber-950/40' : ''}
        `}
        style={{
          transform: isEscaping ? getExitTransform(arrow.direction) : undefined,
          transition: isEscaping
            ? reducedMotion
              ? 'opacity 0.2s ease-out'
              : 'transform 0.36s cubic-bezier(0.12, 0.8, 0.32, 1), opacity 0.36s cubic-bezier(0.12, 0.8, 0.32, 1)'
            : undefined,
          zIndex: isEscaping ? 20 : isHinted ? 10 : 1,
        }}
      >
        {/* Subtle radial inner glow */}
        <div
          className="absolute inset-0 rounded-2xl bg-radial from-white/[0.08] to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        />

        {/* Directional Arrow SVG Graphic with rotation */}
        <div
          className="relative transition-transform duration-200 group-hover:scale-105 flex items-center justify-center"
          style={{
            transform: `rotate(${angle}deg)`,
          }}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 44 44"
            className="w-8 h-8 sm:w-10 sm:h-10 transition-all"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22 38V9M12 19L22 8L32 19"
              stroke={isBlocked ? '#f04444' : isHinted ? '#f5a623' : '#10234d'}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Directional Exit Indicator Beam (Subtle arrow tip guide) */}
        <div
          className="absolute pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity"
          style={{
            transform: `rotate(${angle}deg)`,
          }}
          aria-hidden="true"
        >
          <div className="w-1 h-3 -mt-12 bg-white/60 rounded-full blur-[1px]" />
        </div>
      </button>
    </div>
  );
};
