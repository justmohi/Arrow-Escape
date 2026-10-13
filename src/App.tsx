/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Arrow, GameSettings, GameView, LevelData, MoveRecord, ProgressMap } from './types/game';
import { HANDCRAFTED_LEVELS, getLevelById, getLevelByIndex } from './game/levels';
import { checkEscapePath, getHintArrow } from './game/solver';
import { generateProceduralLevel } from './game/generator';
import { soundManager } from './utils/audio';
import {
  loadProgress,
  saveLevelProgress,
  loadSettings,
  saveSettings,
  hasSeenTutorial,
  markTutorialSeen,
  loadLastPlayedLevelId,
  saveLastPlayedLevelId,
  resetAllData,
  defaultSettings,
} from './utils/storage';

import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { HUD } from './components/HUD';
import { GameBoard } from './components/GameBoard';
import { VictoryModal } from './components/VictoryModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { SettingsModal } from './components/SettingsModal';
import { TutorialModal } from './components/TutorialModal';
import { GeneratorView } from './components/GeneratorView';
import { AuthModal } from './components/AuthModal';
import { MigrationModal } from './components/MigrationModal';

function GameContent() {
  const { migrationModal, saveToCloudOrLocal } = useAuth();

  // --- Persistent Storage State ---
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());

  // --- Navigation & Modal State ---
  const [currentView, setCurrentView] = useState<GameView>('PLAY');
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // --- Active Puzzle State ---
  const [currentLevel, setCurrentLevel] = useState<LevelData>(() => {
    const lastId = loadLastPlayedLevelId();
    if (lastId) {
      const found = getLevelById(lastId);
      if (found) return found;
    }
    return HANDCRAFTED_LEVELS[0];
  });

  const [activeArrows, setActiveArrows] = useState<Arrow[]>(() => currentLevel.arrows);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [movesCount, setMovesCount] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // --- Animation & Feedback Tracking ---
  const [escapingIds, setEscapingIds] = useState<Set<string>>(new Set());
  const [blockedId, setBlockedId] = useState<string | null>(null);
  const [blockedById, setBlockedById] = useState<string | null>(null);
  const [hintedId, setHintedId] = useState<string | null>(null);
  const [hintCountUsed, setHintCountUsed] = useState(0);
  const [isNewBestRecord, setIsNewBestRecord] = useState(false);
  const isAnimatingRef = useRef(false);

  // Sync sound manager settings
  useEffect(() => {
    soundManager.setConfig(settings.soundEnabled, settings.soundVolume);
  }, [settings.soundEnabled, settings.soundVolume]);

  // First time check for tutorial
  useEffect(() => {
    if (!hasSeenTutorial()) {
      setShowTutorial(true);
      markTutorialSeen();
    }
  }, []);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (
      isTimerRunning &&
      !showVictory &&
      !showSettings &&
      !showLevelSelect &&
      !showTutorial &&
      !showAuthModal &&
      !migrationModal
    ) {
      interval = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, showVictory, showSettings, showLevelSelect, showTutorial, showAuthModal, migrationModal]);

  // Load a new level
  const loadLevel = useCallback((level: LevelData) => {
    setCurrentLevel(level);
    setActiveArrows(level.arrows);
    setMoveHistory([]);
    setMovesCount(0);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setEscapingIds(new Set());
    setBlockedId(null);
    setBlockedById(null);
    setHintedId(null);
    setHintCountUsed(0);
    setShowVictory(false);
    isAnimatingRef.current = false;
    setCurrentView('PLAY');

    if (!level.isProcedural) {
      saveLastPlayedLevelId(level.id);
    }
  }, []);

  // Handle arrow click / interaction
  const handleArrowClick = useCallback(
    (arrow: Arrow) => {
      // Prevent double clicking or clicking while busy
      if (isAnimatingRef.current || escapingIds.has(arrow.id) || showVictory) {
        return;
      }

      // Check path ray
      const pathResult = checkEscapePath(
        arrow,
        activeArrows,
        currentLevel.rows,
        currentLevel.cols
      );

      if (pathResult.canEscape) {
        // 1. Success escape path!
        isAnimatingRef.current = true;
        setHintedId(null);

        // Play escape sound with combo tone
        soundManager.playEscape(moveHistory.length);

        // Add to escaping set to trigger CSS translation
        setEscapingIds((prev) => new Set(prev).add(arrow.id));

        // Update moves
        const newMoves = movesCount + 1;
        setMovesCount(newMoves);

        // Push to undo stack
        const record: MoveRecord = {
          arrow,
          remainingCount: activeArrows.length - 1,
          timestamp: Date.now(),
        };
        setMoveHistory((prev) => [...prev, record]);

        // Complete escape after animation duration (350ms)
        setTimeout(() => {
          setActiveArrows((prev) => {
            const next = prev.filter((a) => a.id !== arrow.id);

            // Check for Victory!
            if (next.length === 0) {
              setIsTimerRunning(false);
              soundManager.playVictory();

              // Calculate stars
              const stars =
                newMoves <= currentLevel.parMoves
                  ? 3
                  : newMoves <= currentLevel.parMoves + 2
                  ? 2
                  : 1;

              const updatedProg = saveLevelProgress(
                currentLevel.id,
                stars,
                newMoves,
                timerSeconds
              );
              setProgress(updatedProg);

              // Auto-save to cloud (or local storage for guests)
              saveToCloudOrLocal(updatedProg, settings, currentLevel.id);

              const prevBest = progress[currentLevel.id]?.bestMoves;
              setIsNewBestRecord(!prevBest || newMoves < prevBest);
              setShowVictory(true);
            }

            return next;
          });

          setEscapingIds((prev) => {
            const copy = new Set(prev);
            copy.delete(arrow.id);
            return copy;
          });

          isAnimatingRef.current = false;
        }, 350);
      } else {
        // 2. Blocked collision!
        soundManager.playBlocked();
        setBlockedId(arrow.id);
        setBlockedById(pathResult.blockedBy?.id || null);

        // Reset blocked feedback animation after 240ms
        setTimeout(() => {
          setBlockedId(null);
          setBlockedById(null);
        }, 240);
      }
    },
    [
      activeArrows,
      currentLevel,
      escapingIds,
      moveHistory.length,
      movesCount,
      progress,
      saveToCloudOrLocal,
      settings,
      showVictory,
      timerSeconds,
    ]
  );

  // Working Undo action
  const handleUndo = useCallback(() => {
    if (moveHistory.length === 0 || isAnimatingRef.current || showVictory) return;

    soundManager.playUndo();
    const lastRecord = moveHistory[moveHistory.length - 1];
    setMoveHistory((prev) => prev.slice(0, -1));

    // Restore arrow
    setActiveArrows((prev) => [...prev, lastRecord.arrow]);
    setHintedId(null);
  }, [moveHistory, showVictory]);

  // Working Restart action
  const handleRestart = useCallback(() => {
    if (isAnimatingRef.current) return;
    soundManager.playClick();
    setActiveArrows(currentLevel.arrows);
    setMoveHistory([]);
    setMovesCount(0);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setEscapingIds(new Set());
    setBlockedId(null);
    setBlockedById(null);
    setHintedId(null);
    setShowVictory(false);
    isAnimatingRef.current = false;
  }, [currentLevel]);

  // Working Hint action
  const handleHint = useCallback(() => {
    if (isAnimatingRef.current || showVictory || activeArrows.length === 0) return;

    soundManager.playHint();
    const hint = getHintArrow(activeArrows, currentLevel.rows, currentLevel.cols);
    if (hint) {
      setHintedId(hint.id);
      setHintCountUsed((c) => c + 1);

      // Clear hint highlight automatically after 3 seconds
      setTimeout(() => {
        setHintedId((curr) => (curr === hint.id ? null : curr));
      }, 3000);
    }
  }, [activeArrows, currentLevel, showVictory]);

  // Advance to Next Level
  const handleNextLevel = useCallback(() => {
    soundManager.playClick();
    if (currentLevel.isProcedural) {
      const nextProc = generateProceduralLevel(currentLevel.difficulty);
      loadLevel(nextProc);
    } else {
      const nextIndex = currentLevel.levelNumber; // 1-indexed, so levelNumber is next index in array
      const next = getLevelByIndex(nextIndex);
      if (next) {
        loadLevel(next);
      } else {
        // All handcrafted levels completed! Open level select
        setShowLevelSelect(true);
      }
    }
  }, [currentLevel, loadLevel]);

  // Keyboard accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        setShowLevelSelect(false);
        setShowSettings(false);
        setShowTutorial(false);
        setShowAuthModal(false);
        return;
      }

      if (showVictory) {
        if (e.key === 'Enter' || e.key === 'n' || e.key === 'N') {
          handleNextLevel();
        }
        return;
      }

      if (showSettings || showLevelSelect || showTutorial || showAuthModal || migrationModal) {
        return;
      }

      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleHint();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleHint,
    handleNextLevel,
    handleRestart,
    handleUndo,
    migrationModal,
    showAuthModal,
    showLevelSelect,
    showSettings,
    showTutorial,
    showVictory,
  ]);

  // Calculate if a next level exists
  const hasNextLevel =
    currentLevel.isProcedural || currentLevel.levelNumber < HANDCRAFTED_LEVELS.length;

  return (
    <div className="min-h-screen flex flex-col bg-[#070d1d] text-slate-100 selection:bg-teal-500/20 selection:text-teal-200">
      {/* Top Bar Header */}
      <Header
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenTutorial={() => setShowTutorial(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => {
          const updated = !settings.soundEnabled;
          const nextSettings = { ...settings, soundEnabled: updated };
          setSettings(nextSettings);
          saveToCloudOrLocal(progress, nextSettings, currentLevel.id);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4">
        {currentView === 'GENERATOR' ? (
          <GeneratorView
            onStartLevel={(level) => loadLevel(level)}
            onBackToCampaign={() => setCurrentView('PLAY')}
          />
        ) : (
          <div className="w-full max-w-2xl flex flex-col items-center">
            {/* HUD with working controls and clean unboxed metadata */}
            <HUD
              levelNumber={currentLevel.levelNumber}
              levelName={currentLevel.name}
              difficulty={currentLevel.difficulty}
              isProcedural={currentLevel.isProcedural}
              moves={movesCount}
              parMoves={currentLevel.parMoves}
              remainingArrows={activeArrows.length}
              totalArrows={currentLevel.arrows.length}
              timerSeconds={timerSeconds}
              canUndo={moveHistory.length > 0}
              onUndo={handleUndo}
              onRestart={handleRestart}
              onHint={handleHint}
              hintCountUsed={hintCountUsed}
              isHintActive={!!hintedId}
            />

            {/* Responsive Interactive Game Board */}
            <GameBoard
              rows={currentLevel.rows}
              cols={currentLevel.cols}
              arrows={activeArrows}
              escapingIds={escapingIds}
              blockedId={blockedId}
              blockedById={blockedById}
              hintedId={hintedId}
              reducedMotion={settings.reducedMotion}
              onArrowClick={handleArrowClick}
            />

            {/* Subtle instructional note for beginners */}
            <div className="mt-2 text-center text-xs text-slate-500 max-w-xs sm:max-w-md">
              <p>
                Tap an arrow to send it off the board. Arrows with blocked paths will bump and stay.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer with clean copyright and credits */}
      <footer className="w-full py-3 px-4 border-t border-white/[0.05] text-center text-xs text-slate-600">
        <p>Arrow Escape · Pure logic grid puzzle game with Cloud & Guest saves</p>
      </footer>

      {/* Modals */}
      <VictoryModal
        isOpen={showVictory}
        level={currentLevel}
        moves={movesCount}
        timeSeconds={timerSeconds}
        isNewBest={isNewBestRecord}
        hasNextLevel={hasNextLevel}
        reducedMotion={settings.reducedMotion}
        onNextLevel={handleNextLevel}
        onReplay={handleRestart}
        onSelectLevel={() => {
          setShowVictory(false);
          setShowLevelSelect(true);
        }}
      />

      <LevelSelectModal
        isOpen={showLevelSelect}
        currentLevelId={currentLevel.id}
        progress={progress}
        onSelectLevel={(level) => loadLevel(level)}
        onStartProcedural={(difficulty) => {
          const proc = generateProceduralLevel(difficulty);
          loadLevel(proc);
        }}
        onClose={() => setShowLevelSelect(false)}
      />

      <SettingsModal
        isOpen={showSettings}
        settings={settings}
        onUpdateSettings={(newSettings) => {
          setSettings(newSettings);
          saveToCloudOrLocal(progress, newSettings, currentLevel.id);
        }}
        onResetData={() => {
          resetAllData();
          setProgress({});
          setSettings(defaultSettings);
          saveToCloudOrLocal({}, defaultSettings, HANDCRAFTED_LEVELS[0].id);
          loadLevel(HANDCRAFTED_LEVELS[0]);
        }}
        onOpenAuth={() => setShowAuthModal(true)}
        onClose={() => setShowSettings(false)}
      />

      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Guest-to-Account Migration Modal */}
      {migrationModal && (
        <MigrationModal
          isOpen={migrationModal.isOpen}
          cloudData={migrationModal.cloudData}
          localProgress={migrationModal.localProgress}
          onChoice={migrationModal.onChoice}
        />
      )}
    </div>
  );
}

export default function App() {
  const [syncedKey, setSyncedKey] = useState(0);

  return (
    <AuthProvider
      onSyncApplied={() => {
        // Reload game state from local storage after a cloud sync without
        // remounting AuthProvider (which would restart auth sync repeatedly).
        setSyncedKey((k) => k + 1);
      }}
    >
      <GameContent key={syncedKey} />
    </AuthProvider>
  );
}
