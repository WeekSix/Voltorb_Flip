/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  RotateCcw, 
  Trophy, 
  Skull, 
  Info, 
  ChevronRight, 
  Edit3, 
  MousePointer2,
  Volume2,
  VolumeX
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TileState, TileValue } from './types';
import { generateBoard, getRowInfo, getColInfo } from './utils/gameLogic';
import { sounds } from './utils/sounds';

const TILE_SIZE = "w-16 h-16 sm:w-20 sm:h-20";

type Language = 'en' | 'cn';

const TRANSLATIONS = {
  en: {
    level: "Level",
    score: "Score",
    totalScore: "Total Score",
    memo: "Memo",
    gameOver: "Game Over!",
    hitVoltorb: "You hit a Voltorb. Level decreased to make it easier...",
    tryAgain: "Try Again",
    viewBoard: "View Board",
    levelClear: "Level Clear!",
    foundMultipliers: "You found all multipliers!",
    returnToMenu: "Return to Menu",
    debug: "Debug",
    multiplier: "Multiplier",
    reset: "Reset",
    flip: "Flip",
    newGame: "New Game",
    continue: "Continue",
    rulesTitle: "Game Rules",
    rules: [
      "🌟 Treasure Hunt! Your mission is to find all the hidden 2x and 3x cards. Find them all to win the level!",
      "💣 Boom! Watch out for Voltorbs! If you flip one, it will go KABOOM, and you'll have to try again from the previous level.",
      "🕵️ Secret Clues! Look at the numbers on the side. The big number is the total points, and the small number with the ⚡ shows how many Voltorbs are hiding in that row or column!",
      "🧠 Be a Detective! Use your brain to figure out where the traps are. Use the Memo tool to mark the scary spots and stay safe!"
    ],
    debugTooltip: "Show Answers",
    infoTooltip: "Rules"
  },
  cn: {
    level: "等级",
    score: "本局得分",
    totalScore: "总分",
    memo: "标记",
    gameOver: "游戏结束！",
    hitVoltorb: "你踩到了电球。难度已降低，返回上一关...",
    tryAgain: "再试一次",
    viewBoard: "查看棋盘",
    levelClear: "关卡完成！",
    foundMultipliers: "你找到了所有倍率牌！",
    nextLevel: "下一关",
    returnToMenu: "返回菜单",
    debug: "调试",
    multiplier: "倍率",
    reset: "重置",
    flip: "翻牌",
    newGame: "新游戏",
    continue: "继续游戏",
    rulesTitle: "游戏规则",
    rules: [
      "🌟 寻宝大冒险！ 你的任务是找齐所有隐藏的 2倍 和 3倍 分数牌。找齐它们就能通关啦！",
      "💣 小心炸弹！ 离电球远一点！如果你不小心点到了它，它会砰地爆炸，你也会退回到上一关哦。",
      "🕵️ 神秘线索！ 看看旁边的数字。大数字是这一行或这一列的总分，带 ⚡ 的小数字告诉你这里藏了多少个电球！",
      "🧠 逻辑小侦探！ 动动脑筋避开陷阱。用“标记”功能把危险的地方记下来，向着胜利冲锋吧！"
    ],
    debugTooltip: "显示答案",
    infoTooltip: "规则说明"
  }
};

export default function App() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [board, setBoard] = useState<TileState[][]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [isMemoMode, setIsMemoMode] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<TileValue | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [showStartPage, setShowStartPage] = useState(true);
  const [levelChanged, setLevelChanged] = useState<'up' | 'down' | null>(null);

  const t = TRANSLATIONS[language];

  // Initialize game
  const startNewGame = useCallback((newLevel: number) => {
    setBoard(generateBoard(newLevel));
    setScore(0);
    setIsGameOver(false);
    setIsWin(false);
    setShowModal(false);
  }, []);

  useEffect(() => {
    sounds.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    startNewGame(level);
  }, [level, startNewGame]);

  useEffect(() => {
    if (levelChanged) {
      const timer = setTimeout(() => setLevelChanged(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [levelChanged]);

  const checkWin = (currentBoard: TileState[][]) => {
    // Win if all 2s and 3s are flipped
    for (const row of currentBoard) {
      for (const tile of row) {
        if ((tile.value === 2 || tile.value === 3) && !tile.isFlipped) {
          return false;
        }
      }
    }
    return true;
  };

  const revealAll = (currentBoard: TileState[][]) => {
    return currentBoard.map(row => row.map(t => ({ ...t, isFlipped: true })));
  };

  const handleTileClick = (r: number, c: number) => {
    if (isGameOver || isWin || board[r][c].isFlipped) return;

    if (isMemoMode) {
      sounds.playMemo();
      const newBoard = [...board];
      const tile = { ...newBoard[r][c] };
      const newNotes = new Set(tile.notes);
      
      if (selectedMemo !== null) {
        if (newNotes.has(selectedMemo)) {
          newNotes.delete(selectedMemo);
        } else {
          newNotes.add(selectedMemo);
        }
      }
      
      tile.notes = newNotes;
      newBoard[r][c] = tile;
      setBoard(newBoard);
      return;
    }

    const newBoard = [...board];
    const tile = { ...newBoard[r][c], isFlipped: true };
    newBoard[r][c] = tile;

    if (tile.value === 0) {
      // Hit Voltorb
      sounds.playVoltorb();
      setIsGameOver(true);
      // Reveal everything
      setBoard(revealAll(newBoard));
      // Show modal after delay
      setTimeout(() => setShowModal(true), 1250);
    } else {
      // Update score
      sounds.playFlip();
      const newScore = score === 0 ? tile.value : score * tile.value;
      setScore(newScore);

      if (checkWin(newBoard)) {
        sounds.playWin();
        setIsWin(true);
        setTotalScore(prev => prev + newScore);
        setBoard(revealAll(newBoard));
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
        // Show modal after delay
        setTimeout(() => setShowModal(true), 1250);
      } else {
        setBoard(newBoard);
      }
    }
  };

  const toggleMemoMode = () => {
    setIsMemoMode(!isMemoMode);
    if (!isMemoMode && selectedMemo === null) {
      setSelectedMemo(0);
    }
  };

  if (showStartPage) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/10 blur-[120px] rounded-full" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 w-full max-w-lg bg-[#151619] p-8 rounded-[3rem] border border-white/5 shadow-2xl text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20">
              <Zap className="w-10 h-10 text-emerald-500" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-8 tracking-tight">Voltorb Flip</h1>
          
          <div className="text-left bg-white/5 rounded-2xl p-6 mb-8 border border-white/5">
            <h3 className="text-emerald-500 font-bold uppercase tracking-widest text-xs mb-4">{t.rulesTitle}</h3>
            <ul className="space-y-3">
              {t.rules.map((rule, i) => (
                <li key={i} className="flex gap-3 text-sm text-white/70 leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setTotalScore(0);
                setLevel(1);
                startNewGame(1);
                setShowStartPage(false);
              }}
              className="w-full py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              {t.newGame}
            </button>
            <button
              onClick={() => setShowStartPage(false)}
              className="w-full py-4 bg-white/5 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
            >
              {t.continue}
            </button>
            <button 
              onClick={() => setLanguage(language === 'en' ? 'cn' : 'en')}
              className="mt-2 text-xs text-white/40 hover:text-white transition-colors uppercase tracking-widest font-bold"
            >
              Language: {language === 'en' ? 'English' : '中文'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Header Stats */}
      <div className="w-full max-w-md flex justify-between items-end mb-8 z-10">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-bold mb-1">{t.level}</span>
          <div className="flex items-center gap-4">
            <motion.span 
              key={level}
              initial={levelChanged === 'up' ? { y: 10, opacity: 0 } : levelChanged === 'down' ? { y: -10, opacity: 0 } : {}}
              animate={{ y: 0, opacity: 1 }}
              className={`text-5xl font-mono font-light leading-none tracking-tighter transition-colors duration-500 ${
                levelChanged === 'up' ? 'text-emerald-400' : levelChanged === 'down' ? 'text-red-400' : 'text-white'
              }`}
            >
              {level.toString().padStart(2, '0')}
            </motion.span>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-bold mb-1">{t.score}</span>
              <span className="text-2xl font-mono font-medium text-emerald-400">
                {score.toString().padStart(5, '0')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-bold mb-1">{t.totalScore}</span>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'cn' : 'en')}
              className="px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] font-bold text-white/60 hover:text-white transition-colors"
            >
              {language === 'en' ? 'CN' : 'EN'}
            </button>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 bg-white/5 rounded-lg border border-white/10 text-white/40 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span className="text-4xl font-mono font-light leading-none tracking-tight">
              {totalScore.toString().padStart(5, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative z-10 bg-[#151619] p-4 sm:p-6 rounded-3xl border border-white/5 shadow-2xl">
        {board.length > 0 ? (
          <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {/* 5x5 Grid + Row Indicators */}
            {board.map((row, r) => (
              <React.Fragment key={`row-${r}`}>
                {row.map((tile, c) => (
                  <motion.button
                    key={`tile-${r}-${c}`}
                    whileHover={{ scale: tile.isFlipped ? 1 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTileClick(r, c)}
                    className={`
                      ${TILE_SIZE} rounded-xl relative overflow-hidden transition-colors duration-300
                      ${tile.isFlipped 
                        ? tile.value === 0 ? 'bg-red-500/20 border-red-500/50' : 'bg-emerald-500/20 border-emerald-500/50'
                        : isDebugMode ? 'bg-white/10 border-white/20' : 'bg-[#1f2126] border-white/5 hover:bg-[#2a2d35]'
                      }
                      border flex items-center justify-center
                    `}
                  >
                    <AnimatePresence mode="wait">
                      {tile.isFlipped ? (
                        <motion.div
                          initial={{ rotateY: 90, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          className="flex items-center justify-center"
                        >
                          {tile.value === 0 ? (
                            <Zap className="w-8 h-8 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                          ) : (
                            <span className="text-3xl font-mono font-bold text-emerald-400">
                              {tile.value}
                            </span>
                          )}
                        </motion.div>
                      ) : (
                        <div className="relative w-full h-full">
                          {isDebugMode && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              {tile.value === 0 ? (
                                <Zap className="w-4 h-4 text-red-500/40" />
                              ) : (
                                <span className="text-xl font-mono font-bold text-white/20">
                                  {tile.value}
                                </span>
                              )}
                            </div>
                          )}
                          <motion.div className="w-full h-full p-1 grid grid-cols-2 grid-rows-2 gap-0.5 opacity-60">
                            {[0, 1, 2, 3].map(v => (
                              <div key={v} className="flex items-center justify-center">
                                {tile.notes.has(v as TileValue) && (
                                  <div className={`font-mono font-bold ${v === 0 ? 'text-yellow-400 scale-125' : 'text-[10px]'}`}>
                                    {v === 0 ? <Zap className="w-3 h-3 fill-yellow-400" /> : v}
                                  </div>
                                )}
                              </div>
                            ))}
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
                {/* Row Indicator */}
                <div className={`${TILE_SIZE} bg-[#1a1c21] rounded-xl border border-white/5 flex flex-col items-center justify-center gap-0.5`}>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-mono font-bold text-white/90">{getRowInfo(board, r).sum.toString().padStart(2, '0')}</span>
                    <span className="text-[8px] font-bold text-white/30 uppercase">pts</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-60">
                    <Zap className="w-3 h-3 text-red-500" />
                    <span className="text-xs font-mono font-bold">{getRowInfo(board, r).voltorbs}</span>
                  </div>
                </div>
              </React.Fragment>
            ))}

            {/* Column Indicators */}
            {[0, 1, 2, 3, 4].map(c => (
              <div key={`col-info-${c}`} className={`${TILE_SIZE} bg-[#1a1c21] rounded-xl border border-white/5 flex flex-col items-center justify-center gap-0.5`}>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-mono font-bold text-white/90">{getColInfo(board, c).sum.toString().padStart(2, '0')}</span>
                  <span className="text-[8px] font-bold text-white/30 uppercase">pts</span>
                </div>
                <div className="flex items-center gap-1 opacity-60">
                  <Zap className="w-3 h-3 text-red-500" />
                  <span className="text-xs font-mono font-bold">{getColInfo(board, c).voltorbs}</span>
                </div>
              </div>
            ))}

            {/* Current Multiplier Display */}
            <div className={`${TILE_SIZE} flex flex-col items-center justify-center`}>
              <span className="text-[8px] uppercase tracking-widest text-emerald-500/60 font-bold mb-1">{t.multiplier}</span>
              <span className="text-2xl font-mono font-bold">×{score || 1}</span>
            </div>
          </div>
        ) : (
          <div className="w-[400px] h-[400px] flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RotateCcw className="w-8 h-8 text-emerald-500/50" />
            </motion.div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4 z-10">
        <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex gap-1">
          <button
            onClick={() => setIsMemoMode(false)}
            className={`
              px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-3
              ${!isMemoMode 
                ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                : 'text-white/40 hover:text-white hover:bg-white/5'}
            `}
          >
            <MousePointer2 className="w-5 h-5" />
            <span className="font-bold uppercase tracking-wider text-sm">{t.flip}</span>
          </button>
          <button
            onClick={() => {
              setIsMemoMode(true);
              if (selectedMemo === null) setSelectedMemo(0);
            }}
            className={`
              px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-3
              ${isMemoMode 
                ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                : 'text-white/40 hover:text-white hover:bg-white/5'}
            `}
          >
            <Edit3 className="w-5 h-5" />
            <span className="font-bold uppercase tracking-wider text-sm">{t.memo}</span>
          </button>
        </div>

        <button
          onClick={() => {
            if (isGameOver) {
              const prevLvl = Math.max(1, level - 1);
              setIsGameOver(false);
              setIsWin(false);
              if (prevLvl === level) {
                startNewGame(level);
              } else {
                setLevelChanged('down');
                setLevel(prevLvl);
              }
            } else if (isWin) {
              const nextLvl = Math.min(level + 1, 8);
              setIsGameOver(false);
              setIsWin(false);
              if (nextLvl === level) {
                startNewGame(level);
              } else {
                setLevelChanged('up');
                setLevel(nextLvl);
              }
            } else {
              startNewGame(level);
            }
          }}
          className="px-6 py-3 rounded-2xl bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all flex items-center gap-3"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="font-bold uppercase tracking-wider text-sm">{t.reset}</span>
        </button>
      </div>

      {/* Memo Selection (only visible in memo mode) */}
      <AnimatePresence>
        {isMemoMode && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="mt-6 flex gap-3 p-2 bg-white/5 rounded-2xl border border-white/10"
          >
            {[0, 1, 2, 3].map((v) => (
              <button
                key={v}
                onClick={() => setSelectedMemo(v as TileValue)}
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold transition-all
                  ${selectedMemo === v 
                    ? 'bg-emerald-500 text-black' 
                    : 'bg-white/5 text-white/60 hover:text-white'}
                `}
              >
                {v === 0 ? <Zap className="w-4 h-4" /> : v}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay Messages */}
      <AnimatePresence>
        {isGameOver && showModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
          >
            <div className="bg-[#151619] border border-red-500/30 p-8 rounded-[2.5rem] text-center max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.2)]">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Skull className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-3xl font-bold mb-2">{t.gameOver}</h2>
              <p className="text-white/60 mb-8">
                {level > 1 ? t.hitVoltorb : "You hit a Voltorb. Try again to master this level!"}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    const prevLvl = Math.max(1, level - 1);
                    if (prevLvl !== level) setLevelChanged('down');
                    setLevel(prevLvl);
                    startNewGame(prevLvl);
                  }}
                  className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors"
                >
                  {t.tryAgain}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 bg-white/5 text-white/60 font-medium rounded-xl hover:bg-white/10 transition-colors"
                >
                  {t.viewBoard}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isWin && showModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
          >
            <div className="bg-[#151619] border border-emerald-500/30 p-8 rounded-[2.5rem] text-center max-w-sm w-full shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-bold mb-2">{t.levelClear}</h2>
              <p className="text-white/60 mb-2">{t.foundMultipliers}</p>
              <div className="text-4xl font-mono font-bold text-emerald-400 mb-8">+{score}</div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    const nextLvl = Math.min(level + 1, 8);
                    if (nextLvl !== level) setLevelChanged('up');
                    setLevel(nextLvl);
                    startNewGame(nextLvl);
                  }}
                  className="w-full py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-colors"
                >
                  {t.nextLevel}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 bg-white/5 text-white/60 font-medium rounded-xl hover:bg-white/10 transition-colors"
                >
                  {t.viewBoard}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button when modal is hidden during game end */}
      <AnimatePresence>
        {(isWin || isGameOver) && !showModal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
          >
            <button
              onClick={() => setShowModal(true)}
              className={`px-8 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-2 ${
                isWin ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'
              }`}
            >
              {isWin ? <Trophy className="w-5 h-5" /> : <Skull className="w-5 h-5" />}
              {t.returnToMenu}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions & Debug Modal (Optional/Toggle) */}
      <div className="fixed bottom-4 right-4 z-10 flex flex-col gap-2 items-end">
        <div className="flex gap-2">
          <div className="flex flex-col items-center gap-1 group">
            <span className="text-[8px] font-bold text-white/0 group-hover:text-amber-500 transition-colors uppercase tracking-widest">{t.debugTooltip}</span>
            <button 
              onClick={() => setIsDebugMode(!isDebugMode)}
              className={`p-3 rounded-full border transition-all ${isDebugMode ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
            >
              <Skull className="w-6 h-6" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-1 group">
            <span className="text-[8px] font-bold text-white/0 group-hover:text-emerald-500 transition-colors uppercase tracking-widest">{t.infoTooltip}</span>
            <button 
              onClick={() => setShowStartPage(true)}
              className="p-3 bg-white/5 rounded-full border border-white/10 text-white/40 hover:text-white transition-colors"
            >
              <Info className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-8 text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold">
        Voltorb Flip • System v2.5.0
      </div>
    </div>
  );
}
