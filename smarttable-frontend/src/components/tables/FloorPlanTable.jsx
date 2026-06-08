import { useCallback, useEffect, useRef, useState } from 'react';
import { GripVertical, Users } from 'lucide-react';
import {
  clampPosition,
  getEffectiveStatut,
  getStatutConfig,
  getTableDimensions,
} from '../../lib/tableUtils';

const DRAG_THRESHOLD = 6;

export default function FloorPlanTable({
  table,
  position,
  editMode,
  isDragging,
  onPointerDown,
  onClick,
}) {
  const statut = getEffectiveStatut(table);
  const config = getStatutConfig(table);
  const floor = config.floor || {};
  const dims = getTableDimensions(table.capacite);
  const isRound = dims.shape === 'round';

  return (
    <button
      type="button"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: dims.width,
        height: dims.height,
        zIndex: isDragging ? 50 : 10,
      }}
      onPointerDown={(e) => onPointerDown(e, table)}
      onClick={(e) => {
        e.stopPropagation();
        onClick(table);
      }}
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center border-2 border-white/20 bg-gradient-to-br ${floor.fill || 'from-slate-500 to-slate-700'} ${floor.text || 'text-white'} ring-2 ${floor.ring || 'ring-white/30'} transition-shadow duration-300 ${
        isRound ? 'rounded-full' : 'rounded-xl'
      } ${floor.glow || ''} ${floor.pulse ? 'animate-pulse' : ''} ${
        editMode ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-pointer hover:scale-110 hover:brightness-110'
      } ${isDragging ? 'scale-110 shadow-2xl ring-4 ring-white/50' : 'shadow-lg'}`}
      title={`Table ${table.numero_table} — ${config.label}`}
    >
      {editMode && (
        <GripVertical className="absolute -right-1 -top-1 h-3 w-3 text-white/60" aria-hidden />
      )}
      <span className="text-base font-bold leading-none drop-shadow-sm">{table.numero_table}</span>
      <span className="mt-0.5 flex items-center gap-0.5 text-[9px] font-medium opacity-90">
        <Users className="h-2.5 w-2.5" />
        {table.capacite ?? 4}
      </span>
      {table.active_orders_count > 0 && statut === 'occupee' && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-red-600 shadow-md">
          {table.active_orders_count}
        </span>
      )}
      {table.upcoming_reservation && statut === 'reservee' && (
        <span className="absolute -bottom-5 left-1/2 max-w-[90px] -translate-x-1/2 truncate rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
          {table.upcoming_reservation.heure_reservation}
        </span>
      )}
    </button>
  );
}

export function useFloorPlanDrag({ tables, editMode, onPositionChange, onSelectTable }) {
  const canvasRef = useRef(null);
  const [localPositions, setLocalPositions] = useState({});
  const [dragging, setDragging] = useState(null);
  const preventClickRef = useRef(false);

  useEffect(() => {
    if (!dragging) {
      setLocalPositions({});
    }
  }, [tables, dragging]);

  const getPosition = useCallback(
    (table) => {
      if (localPositions[table.id]) return localPositions[table.id];
      return { x: table.pos_x ?? 20, y: table.pos_y ?? 20 };
    },
    [localPositions]
  );

  const handlePointerDown = useCallback(
    (e, table) => {
      if (!editMode) return;
      e.preventDefault();
      e.stopPropagation();
      preventClickRef.current = false;
      const pos = getPosition(table);
      setDragging({
        id: table.id,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        origX: pos.x,
        origY: pos.y,
      });
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [editMode, getPosition]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragging || !canvasRef.current) return;
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        preventClickRef.current = true;
      }
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = clampPosition(dragging.origX + (dx / rect.width) * 100);
      const newY = clampPosition(dragging.origY + (dy / rect.height) * 100);
      setLocalPositions((prev) => ({
        ...prev,
        [dragging.id]: { x: newX, y: newY },
      }));
    },
    [dragging]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (!dragging) return;
      const pos = localPositions[dragging.id];
      if (pos && preventClickRef.current) {
        onPositionChange?.(dragging.id, pos.x, pos.y);
      }
      setDragging(null);
      try {
        e.currentTarget?.releasePointerCapture?.(dragging.pointerId);
      } catch {
        /* ignore */
      }
    },
    [dragging, localPositions, onPositionChange]
  );

  const handleTableClick = useCallback(
    (table) => {
      if (preventClickRef.current) {
        preventClickRef.current = false;
        return;
      }
      onSelectTable?.(table);
    },
    [onSelectTable]
  );

  return {
    canvasRef,
    dragging,
    getPosition,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTableClick,
  };
}
