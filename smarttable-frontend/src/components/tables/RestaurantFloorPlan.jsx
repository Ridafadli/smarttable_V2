import { useEffect, useState } from 'react';
import {
  ChefHat,
  DoorOpen,
  Grip,
  Maximize2,
  Minimize2,
  Move,
  Radio,
  Wine,
} from 'lucide-react';
import FloorPlanTable, { useFloorPlanDrag } from './FloorPlanTable';
import { FLOOR_LEGEND, getStatutConfig } from '../../lib/tableUtils';

function LiveIndicator({ lastUpdated }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      Live
      {lastUpdated && (
        <span className="text-emerald-500/70">
          · {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      )}
    </span>
  );
}

export default function RestaurantFloorPlan({
  tables,
  onSelectTable,
  editMode = false,
  onEditModeChange,
  onPositionChange,
  fullScreen = false,
  onToggleFullScreen,
  lastUpdated,
  compact = false,
}) {
  const [mounted, setMounted] = useState(false);

  const {
    canvasRef,
    dragging,
    getPosition,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTableClick,
  } = useFloorPlanDrag({
    tables,
    editMode,
    onPositionChange,
    onSelectTable,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!tables?.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-600/40 bg-slate-900/50 text-sm text-slate-400">
        Aucune table à afficher sur le plan
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950 shadow-2xl ${
        fullScreen ? 'fixed inset-0 z-[200] rounded-none border-0' : ''
      }`}
    >
      {/* Header toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 bg-slate-900/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Radio className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Plan de salle interactif</p>
            <p className="text-[11px] text-slate-400">
              {editMode ? 'Mode édition — glissez les tables pour les repositionner' : 'Cliquez sur une table pour les détails'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LiveIndicator lastUpdated={lastUpdated} />
          <button
            type="button"
            onClick={() => onEditModeChange?.(!editMode)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              editMode
                ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {editMode ? <Move className="h-3.5 w-3.5" /> : <Grip className="h-3.5 w-3.5" />}
            {editMode ? 'Édition active' : 'Éditer le plan'}
          </button>
          {onToggleFullScreen && (
            <button
              type="button"
              onClick={onToggleFullScreen}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              {fullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              {fullScreen ? 'Quitter' : 'Plein écran'}
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`relative w-full select-none ${compact ? 'aspect-[16/9] min-h-[320px]' : 'aspect-[16/10] min-h-[400px]'} ${
          editMode ? 'cursor-crosshair' : ''
        }`}
      >
        {/* Premium floor background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.06) 0%, transparent 50%),
              linear-gradient(180deg, #1a1f2e 0%, #0f1419 40%, #0a0e14 100%)
            `,
          }}
        />

        {/* Wood floor pattern */}
        <div
          className="absolute inset-3 rounded-2xl opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(180,140,90,0.03) 1px, transparent 1px),
              linear-gradient(rgba(180,140,90,0.03) 1px, transparent 1px),
              linear-gradient(135deg, rgba(120,90,60,0.15) 25%, transparent 25%)
            `,
            backgroundSize: '48px 48px, 48px 48px, 96px 96px',
          }}
        />

        {/* Room boundary */}
        <div className="absolute inset-3 rounded-2xl border border-slate-600/30 bg-slate-900/20 shadow-inner">
          {/* Grid overlay in edit mode */}
          {editMode && (
            <div
              className="absolute inset-0 rounded-2xl opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(148,163,184,0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(148,163,184,0.3) 1px, transparent 1px)
                `,
                backgroundSize: '5% 5%',
              }}
            />
          )}

          {/* Zone labels */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300 backdrop-blur-sm">
            <DoorOpen className="h-3 w-3 text-emerald-400" />
            Entrée
          </div>
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300 backdrop-blur-sm">
            <Wine className="h-3 w-3 text-violet-400" />
            Bar
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300 backdrop-blur-sm">
            <ChefHat className="h-3 w-3 text-amber-400" />
            Cuisine
          </div>

          {/* Decorative elements */}
          <div className="absolute bottom-3 left-3 h-16 w-24 rounded-lg border border-dashed border-slate-600/40 bg-slate-800/30" aria-hidden />
          <div className="absolute left-1/2 top-3 h-8 w-32 -translate-x-1/2 rounded-full border border-slate-600/30 bg-slate-800/20" aria-hidden />

          {/* Tables */}
          <div className={`absolute inset-0 ${mounted ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
            {tables.map((table) => (
              <FloorPlanTable
                key={table.id}
                table={table}
                position={getPosition(table)}
                editMode={editMode}
                isDragging={dragging?.id === table.id}
                onPointerDown={handlePointerDown}
                onClick={handleTableClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/60 bg-slate-900/95 px-4 py-3 backdrop-blur-md">
        <div className="flex flex-wrap gap-4">
          {FLOOR_LEGEND.map(({ key, label }) => {
            const cfg = getStatutConfig({ effective_statut: key });
            const floor = cfg.floor || {};
            return (
              <span key={key} className="inline-flex items-center gap-2 text-xs text-slate-400">
                <span className={`h-3.5 w-3.5 rounded-full bg-gradient-to-br ${floor.fill || 'from-slate-500 to-slate-600'} ring-2 ${floor.ring || 'ring-slate-500'}`} />
                {label}
              </span>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-500">
          {tables.length} table{tables.length > 1 ? 's' : ''} · SmartTable Floor Plan
        </p>
      </div>
    </div>
  );
}
