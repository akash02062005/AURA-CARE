import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertGameScoreSchema } from "@shared/schema";
import { 
  Gamepad2, 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy, 
  Timer, 
  Heart,
  Brain,
  Zap,
  Target,
  Star,
  Award,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

interface Game {
  id: string;
  name: string;
  description: string;
  type: "breathing" | "memory" | "puzzle" | "focus" | "relaxation";
  difficulty: "easy" | "medium" | "hard";
  mood: string[];
  icon: React.ReactNode;
  color: string;
}

interface GameScore {
  id: string;
  gameType: string;
  score: number;
  duration?: number;
  difficulty: string;
  mood: string;
  createdAt: string;
}

const games: Game[] = [
  {
    id: "breathing-exercise",
    name: "Breathing Circle",
    description: "Follow the expanding circle to practice deep breathing",
    type: "breathing",
    difficulty: "easy",
    mood: ["anxious", "stressed", "overwhelmed"],
    icon: <Heart className="w-6 h-6" />,
    color: "bg-blue-500"
  },
  {
    id: "memory-cards",
    name: "Memory Match",
    description: "Match pairs of calming images to improve focus",
    type: "memory",
    difficulty: "medium",
    mood: ["distracted", "unfocused", "restless"],
    icon: <Brain className="w-6 h-6" />,
    color: "bg-purple-500"
  },
  {
    id: "puzzle-solver",
    name: "Mindful Puzzle",
    description: "Solve puzzles while practicing mindfulness",
    type: "puzzle",
    difficulty: "medium",
    mood: ["bored", "restless", "need-stimulation"],
    icon: <Target className="w-6 h-6" />,
    color: "bg-green-500"
  },
  {
    id: "focus-trainer",
    name: "Focus Flow",
    description: "Train your attention with flowing patterns",
    type: "focus",
    difficulty: "hard",
    mood: ["unfocused", "scattered", "overwhelmed"],
    icon: <Zap className="w-6 h-6" />,
    color: "bg-yellow-500"
  },
  {
    id: "relaxation-waves",
    name: "Calming Waves",
    description: "Watch and interact with soothing wave patterns",
    type: "relaxation",
    difficulty: "easy",
    mood: ["stressed", "anxious", "tense"],
    icon: <Sparkles className="w-6 h-6" />,
    color: "bg-cyan-500"
  }
];

export default function Games() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "completed">("menu");
  const [currentScore, setCurrentScore] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [userMood, setUserMood] = useState("neutral");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  
  // Breathing game state
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale" | "pause">("inhale");
  const [breathingCycle, setBreathingCycle] = useState(0);
  const [breathingScale, setBreathingScale] = useState(1);
  
  // Memory game state
  const [memoryCards, setMemoryCards] = useState<Array<{id: number, content: string, flipped: boolean, matched: boolean}>>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: gameScores } = useQuery({
    queryKey: ["/api/game-scores"],
  });

  const createGameScoreMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertGameScoreSchema>) => {
      const response = await apiRequest("POST", "/api/game-scores", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game-scores"] });
      toast({
        title: "Score Saved",
        description: "Your game performance has been recorded!",
        variant: "default",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error("Failed to save game score:", error);
    },
  });

  // Game timer effect
  useEffect(() => {
    if (gameState === "playing") {
      gameTimerRef.current = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    } else {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
    }

    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
    };
  }, [gameState]);

  // Breathing game effect
  useEffect(() => {
    if (selectedGame?.type === "breathing" && gameState === "playing") {
      const phases = [
        { name: "inhale", duration: 4000, scale: 1.5 },
        { name: "hold", duration: 2000, scale: 1.5 },
        { name: "exhale", duration: 6000, scale: 1 },
        { name: "pause", duration: 1000, scale: 1 }
      ];
      
      let phaseIndex = 0;
      
      const nextPhase = () => {
        const phase = phases[phaseIndex];
        setBreathingPhase(phase.name as any);
        setBreathingScale(phase.scale);
        
        breathingTimerRef.current = setTimeout(() => {
          phaseIndex = (phaseIndex + 1) % phases.length;
          if (phaseIndex === 0) {
            setBreathingCycle(prev => prev + 1);
            if (breathingCycle >= 9) { // 10 cycles
              completeGame();
            }
          }
          nextPhase();
        }, phase.duration);
      };
      
      nextPhase();
    }

    return () => {
      if (breathingTimerRef.current) {
        clearTimeout(breathingTimerRef.current);
      }
    };
  }, [selectedGame, gameState, breathingCycle]);

  const startGame = (game: Game) => {
    setSelectedGame(game);
    setGameState("playing");
    setCurrentScore(0);
    setGameTime(0);
    setBreathingCycle(0);
    setBreathingScale(1);
    
    if (game.type === "memory") {
      initializeMemoryGame();
    }
  };

  const initializeMemoryGame = () => {
    const symbols = ["🌸", "🌿", "🌙", "⭐", "🦋", "🌊", "🍃", "☀️"];
    const pairs = symbols.slice(0, difficulty === "easy" ? 4 : difficulty === "medium" ? 6 : 8);
    const cards = [...pairs, ...pairs]
      .map((content, id) => ({ id, content, flipped: false, matched: false }))
      .sort(() => Math.random() - 0.5);
    
    setMemoryCards(cards);
    setFlippedCards([]);
    setMemoryMoves(0);
  };

  const handleMemoryCardClick = (cardId: number) => {
    if (flippedCards.length === 2 || memoryCards[cardId].flipped || memoryCards[cardId].matched) {
      return;
    }

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);
    
    const newCards = [...memoryCards];
    newCards[cardId].flipped = true;
    setMemoryCards(newCards);

    if (newFlippedCards.length === 2) {
      setMemoryMoves(prev => prev + 1);
      
      setTimeout(() => {
        const [first, second] = newFlippedCards;
        if (memoryCards[first].content === memoryCards[second].content) {
          // Match found
          newCards[first].matched = true;
          newCards[second].matched = true;
          setCurrentScore(prev => prev + 100);
          
          // Check if all cards are matched
          if (newCards.every(card => card.matched)) {
            completeGame();
          }
        } else {
          // No match
          newCards[first].flipped = false;
          newCards[second].flipped = false;
        }
        
        setMemoryCards([...newCards]);
        setFlippedCards([]);
      }, 1000);
    }
  };

  const pauseGame = () => {
    setGameState("paused");
  };

  const resumeGame = () => {
    setGameState("playing");
  };

  const completeGame = () => {
    setGameState("completed");
    
    if (selectedGame) {
      const finalScore = selectedGame.type === "breathing" 
        ? breathingCycle * 10 
        : selectedGame.type === "memory" 
        ? Math.max(0, 1000 - (memoryMoves * 50) + (difficulty === "hard" ? 200 : difficulty === "medium" ? 100 : 0))
        : currentScore;
      
      createGameScoreMutation.mutate({
        gameType: selectedGame.type,
        score: finalScore,
        duration: gameTime,
        difficulty,
        mood: userMood,
      });
    }
  };

  const resetGame = () => {
    setGameState("menu");
    setSelectedGame(null);
    setCurrentScore(0);
    setGameTime(0);
    setBreathingCycle(0);
    setMemoryMoves(0);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPhaseInstruction = () => {
    switch (breathingPhase) {
      case "inhale":
        return "Breathe in slowly...";
      case "hold":
        return "Hold your breath...";
      case "exhale":
        return "Breathe out slowly...";
      case "pause":
        return "Pause and relax...";
      default:
        return "";
    }
  };

  const getMoodRecommendations = (mood: string) => {
    switch (mood) {
      case "anxious":
        return games.filter(g => g.mood.includes("anxious"));
      case "stressed":
        return games.filter(g => g.mood.includes("stressed"));
      case "unfocused":
        return games.filter(g => g.mood.includes("unfocused"));
      default:
        return games.slice(0, 3);
    }
  };

  if (gameState !== "menu") {
    return (
      <div className="min-h-screen p-6">
        <div className="container mx-auto max-w-4xl">
          {/* Game Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={resetGame}
                data-testid="button-back-to-menu"
              >
                ← Back to Menu
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedGame?.name}</h2>
                <p className="text-muted-foreground">{selectedGame?.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="text-lg font-bold text-foreground">{formatTime(gameTime)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-lg font-bold text-primary">{currentScore}</p>
              </div>
            </div>
          </motion.div>

          {/* Game Controls */}
          <div className="flex justify-center space-x-4 mb-6">
            {gameState === "playing" && (
              <Button onClick={pauseGame} data-testid="button-pause-game">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}
            {gameState === "paused" && (
              <Button onClick={resumeGame} data-testid="button-resume-game">
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            )}
            <Button variant="outline" onClick={resetGame} data-testid="button-restart-game">
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart
            </Button>
          </div>

          {/* Game Content */}
          <Card className="glass-effect">
            <CardContent className="p-8">
              {/* Breathing Game */}
              {selectedGame?.type === "breathing" && (
                <div className="text-center space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">
                      {getPhaseInstruction()}
                    </h3>
                    <p className="text-muted-foreground">
                      Cycle {breathingCycle + 1} of 10
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <motion.div
                      animate={{ scale: breathingScale }}
                      transition={{ 
                        duration: breathingPhase === "inhale" ? 4 : breathingPhase === "exhale" ? 6 : 0,
                        ease: "easeInOut"
                      }}
                      className="w-48 h-48 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border-4 border-primary/50 flex items-center justify-center"
                    >
                      <Heart className="w-16 h-16 text-primary" />
                    </motion.div>
                  </div>
                  
                  <Progress value={(breathingCycle / 10) * 100} className="w-full max-w-md mx-auto" />
                </div>
              )}

              {/* Memory Game */}
              {selectedGame?.type === "memory" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Memory Match
                    </h3>
                    <p className="text-muted-foreground">Moves: {memoryMoves}</p>
                  </div>
                  
                  <div className={`grid gap-4 mx-auto max-w-md ${
                    difficulty === "easy" ? "grid-cols-4" : 
                    difficulty === "medium" ? "grid-cols-4" : "grid-cols-4"
                  }`}>
                    {memoryCards.map((card) => (
                      <motion.div
                        key={card.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleMemoryCardClick(card.id)}
                        className={`aspect-square rounded-lg border-2 cursor-pointer flex items-center justify-center text-2xl ${
                          card.flipped || card.matched
                            ? "bg-background border-primary"
                            : "bg-muted border-border hover:border-primary/50"
                        } ${card.matched ? "ring-2 ring-green-500" : ""}`}
                        data-testid={`memory-card-${card.id}`}
                      >
                        {(card.flipped || card.matched) ? card.content : "?"}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Game Completed */}
              {gameState === "completed" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">Well Done!</h3>
                    <p className="text-muted-foreground">You completed the {selectedGame?.name}!</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="bg-background rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Final Score</p>
                      <p className="text-2xl font-bold text-primary">{currentScore}</p>
                    </div>
                    <div className="bg-background rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="text-2xl font-bold text-secondary">{formatTime(gameTime)}</p>
                    </div>
                  </div>
                  <Button onClick={resetGame} className="bg-primary hover:bg-primary/90" data-testid="button-play-again">
                    Play Again
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">Wellness Games</h1>
          <p className="text-muted-foreground text-lg">
            Therapeutic games designed to support your mental well-being
          </p>
        </motion.div>

        {/* Mood Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>How are you feeling today?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["anxious", "stressed", "unfocused", "restless", "neutral"].map((mood) => (
                  <Button
                    key={mood}
                    variant={userMood === mood ? "default" : "outline"}
                    onClick={() => setUserMood(mood)}
                    className="capitalize"
                    data-testid={`button-mood-${mood}`}
                  >
                    {mood}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommended Games */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Recommended for {userMood === "neutral" ? "You" : `${userMood} mood`}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getMoodRecommendations(userMood).map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="glass-effect card-3d h-full">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className={`w-16 h-16 ${game.color} rounded-2xl flex items-center justify-center mx-auto text-white`}>
                      {game.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg mb-2">{game.name}</h3>
                      <p className="text-muted-foreground text-sm">{game.description}</p>
                    </div>
                    <div className="flex justify-center space-x-2">
                      <Badge variant="outline" className="capitalize">{game.type}</Badge>
                      <Badge variant="outline" className="capitalize">{game.difficulty}</Badge>
                    </div>
                    <Button
                      onClick={() => startGame(game)}
                      className="w-full bg-primary hover:bg-primary/90"
                      data-testid={`button-play-${game.id}`}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play Now
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* All Games */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold text-foreground mb-6">All Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="glass-effect card-3d h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 ${game.color} rounded-lg flex items-center justify-center text-white`}>
                        {game.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{game.name}</h3>
                        <p className="text-muted-foreground text-sm">{game.description}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Badge variant="outline" className="capitalize">{game.type}</Badge>
                        <Badge variant="outline" className="capitalize">{game.difficulty}</Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => startGame(game)}
                        data-testid={`button-play-all-${game.id}`}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Game Statistics */}
        {gameScores && gameScores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-primary" />
                  <span>Your Game Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{gameScores.length}</p>
                    <p className="text-sm text-muted-foreground">Games Played</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-secondary">
                      {Math.round(gameScores.reduce((sum: number, score: GameScore) => sum + score.score, 0) / gameScores.length)}
                    </p>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">
                      {Math.max(...gameScores.map((score: GameScore) => score.score))}
                    </p>
                    <p className="text-sm text-muted-foreground">Best Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
