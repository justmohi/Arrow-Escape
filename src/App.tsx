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
import { HomeScreen } from './components/HomeScreen';
import { MeScreen } from './components/MeScreen';
import { OutOfLivesModal } from './components/OutOfLivesModal';
import { Home, CalendarDays, UserRound, X, Trophy } from 'lucide-react';

function GameContent() {
  const { migrationModal, saveToCloudOrLocal } = useAuth();

  // --- Persistent Storage State ---
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());

  // --- Navigation & Modal State ---
  const [currentView, setCurrentView] = useState<GameView>('HOME');
  const [showTournament, setShowTournament] = useState(false);
  const [infoPanel, setInfoPanel] = useState<{ title: string; description: string } | null>(null);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [showOutOfLives, setShowOutOfLives] = useState(false);
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
  const [livesCount, setLivesCount] = useState(3);
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
    let interval: ReturnType<typeof setInterval> | null = null;
    if (
      currentView === 'PLAY' &&
      isTimerRunning &&
      !showVictory &&
      !showOutOfLives &&
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
  }, [currentView, isTimerRunning, showVictory, showOutOfLives, showSettings, showLevelSelect, showTutorial, showAuthModal, migrationModal]);

  // Load a new level
  const loadLevel = useCallback((level: LevelData) => {
    setCurrentLevel(level);
    setActiveArrows(level.arrows);
    setMoveHistory([]);
    setMovesCount(0);
    setLivesCount(3);
    setShowOutOfLives(false);
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

    // Persist the selected campaign level locally and to the signed-in user's cloud save.
    // Procedural boards are generated at runtime and are not yet serializable for restore.
    if (!level.isProcedural) {
      void saveToCloudOrLocal(progress, settings, level.id);
    }
  }, [progress, settings, saveToCloudOrLocal]);

  // Handle arrow click / interaction
  const handleArrowClick = useCallback(
    (arrow: Arrow) => {
      // Prevent double clicking or clicking while busy
      if (isAnimatingRef.current || escapingIds.has(arrow.id) || showVictory || showOutOfLives) {
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

              // Save the next campaign level as the resume point immediately, even if
              // the player closes the browser while the victory dialog is still open.
              // Procedural boards cannot currently be reconstructed after a reload.
              const nextCampaignLevel = currentLevel.isProcedural
                ? undefined
                : getLevelByIndex(currentLevel.levelNumber);
              const resumeLevelId = currentLevel.isProcedural
                ? undefined
                : (nextCampaignLevel?.id || currentLevel.id);
              saveToCloudOrLocal(updatedProg, settings, resumeLevelId);

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
        if (livesCount <= 1) {
          setLivesCount(0);
          setShowOutOfLives(true);
          setIsTimerRunning(false);
        } else {
          setLivesCount(livesCount - 1);
        }

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
      livesCount,
      moveHistory.length,
      movesCount,
      progress,
      saveToCloudOrLocal,
      settings,
      showVictory,
      showOutOfLives,
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
    setLivesCount(3);
    setShowOutOfLives(false);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setEscapingIds(new Set());
    setBlockedId(null);
    setBlockedById(null);
    setHintedId(null);
    setShowVictory(false);
    isAnimatingRef.current = false;
    if (!currentLevel.isProcedural) {
      void saveToCloudOrLocal(progress, settings, currentLevel.id);
    }
  }, [currentLevel, progress, settings, saveToCloudOrLocal]);

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

  const startDailyChallenge = () => {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const dailyLevel = HANDCRAFTED_LEVELS[dayOfYear % HANDCRAFTED_LEVELS.length] || HANDCRAFTED_LEVELS[0];
    loadLevel(dailyLevel);
  };

  return (
    <div className={`app-shell min-h-screen flex flex-col ${currentView === 'HOME' || currentView === 'ME' ? 'app-shell-home' : ''}`}>
      {(currentView === 'PLAY' || currentView === 'GENERATOR') && (
        <Header
          currentView={currentView}
          onNavigate={(view) => {
            if (view === 'LEVEL_SELECT') {
              setShowLevelSelect(true);
              return;
            }
            setCurrentView(view);
          }}
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
      )}

      <main className={`app-main flex-1 flex flex-col items-center ${currentView === 'PLAY' ? 'game-main' : ''}`}>
        {currentView === 'HOME' ? (
          <HomeScreen
            levelNumber={currentLevel.levelNumber}
            onContinue={() => setCurrentView('PLAY')}
            onRestart={() => {
              handleRestart();
              setCurrentView('PLAY');
            }}
            onDaily={startDailyChallenge}
            onTournament={() => setShowTournament(true)}
          />
        ) : currentView === 'ME' ? (
          <MeScreen
            progress={progress}
            onSettings={() => setShowSettings(true)}
            onHelp={() => setShowTutorial(true)}
            onInfo={(section) => {
              const descriptions: Record<'Awards' | 'Achievements' | 'About Game' | 'Privacy', string> = {
                Awards: `${Object.values(progress).reduce((sum, item) => sum + (item.stars || 0), 0)} stars earned across ${Object.values(progress).filter((item) => item.completed).length} completed levels.`,
                Achievements: 'Complete more puzzles, earn stars, and improve your best move counts to build your puzzle record.',
                'About Game': 'Arrow Escape is a logic puzzle game. Tap an arrow only when its path to the board edge is clear.',
                Privacy: 'Progress and settings are stored in this browser. If you sign in, game progress can also sync with your account. No ad-reward verification is configured in this project.',
              };
              setInfoPanel({ title: section, description: descriptions[section] });
            }}
          />
        ) : currentView === 'GENERATOR' ? (
          <GeneratorView
            onStartLevel={(level) => loadLevel(level)}
            onBackToCampaign={() => setCurrentView('PLAY')}
          />
        ) : (
          <div className="w-full max-w-2xl flex flex-col items-center game-content">
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
              lives={livesCount}
            />
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
            <div className="game-instructions mt-2 text-center text-xs text-slate-500 max-w-xs sm:max-w-md">
              <p>Tap an arrow to send it off the board. If its path is blocked, clear the obstacle first.</p>
            </div>
            <button type="button" className="back-home-link" onClick={() => setCurrentView('HOME')}>
              <Home size={16} /> Main Menu
            </button>
          </div>
        )}
      </main>

      {(currentView === 'PLAY' || currentView === 'GENERATOR') && (
        <footer className="app-footer w-full py-3 px-4 text-center text-xs">
          <p>Arrow Escape · A logic puzzle game with local and cloud saves</p>
        </footer>
      )}

      {(currentView === 'HOME' || currentView === 'ME') && (
        <nav className="bottom-game-nav" aria-label="Main navigation">
          <button type="button" className={currentView === 'HOME' ? 'active' : ''} onClick={() => setCurrentView('HOME')}>
            <Home size={23} strokeWidth={2.5} /><span>Main</span>
          </button>
          <button type="button" onClick={startDailyChallenge}>
            <CalendarDays size={22} strokeWidth={2.3} /><span>Daily</span>
          </button>
          <button type="button" className={currentView === 'ME' ? 'active' : ''} onClick={() => setCurrentView('ME')}>
            <UserRound size={23} strokeWidth={2.5} /><span>Me</span>
          </button>
        </nav>
      )}

      {showOutOfLives && (
        <OutOfLivesModal
          onContinue={() => {
            setLivesCount(1);
            setShowOutOfLives(false);
            setIsTimerRunning(true);
          }}
          onRestart={handleRestart}
        />
      )}

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

      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {showTournament && (
        <div className="feature-overlay" role="dialog" aria-modal="true" aria-labelledby="tournament-title">
          <div className="feature-dialog">
            <button type="button" className="feature-close" onClick={() => setShowTournament(false)} aria-label="Close"><X size={20} /></button>
            <div className="feature-dialog-icon"><Trophy size={30} /></div>
            <h2 id="tournament-title">Weekly Tournament</h2>
            <p>Challenge mode is being prepared. You can keep improving your level scores while tournament rankings are added.</p>
            <button type="button" className="feature-primary" onClick={() => { setShowTournament(false); setShowLevelSelect(true); }}>Choose a puzzle</button>
          </div>
        </div>
      )}

      {infoPanel && (
        <div className="feature-overlay" role="dialog" aria-modal="true" aria-labelledby="info-panel-title">
          <div className="feature-dialog">
            <button type="button" className="feature-close" onClick={() => setInfoPanel(null)} aria-label="Close"><X size={20} /></button>
            <div className="feature-dialog-icon"><Trophy size={30} /></div>
            <h2 id="info-panel-title">{infoPanel.title}</h2>
            <p>{infoPanel.description}</p>
            <button type="button" className="feature-primary" onClick={() => setInfoPanel(null)}>Got it</button>
          </div>
        </div>
      )}

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
