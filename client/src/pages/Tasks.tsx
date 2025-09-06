import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  CheckCircle, 
  Circle, 
  Target, 
  Flame, 
  Trophy, 
  Calendar,
  Clock,
  Star,
  Zap,
  Heart,
  Brain,
  Leaf,
  Moon,
  Sun,
  Award,
  TrendingUp,
  RotateCcw,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from 'canvas-confetti';

interface DailyTask {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  completed: boolean;
  completedAt?: string;
  date: string;
}

interface UserStreak {
  id: string;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  badges: string[];
  lastActiveDate?: string;
}

const taskCategories = [
  { id: "mindfulness", label: "Mindfulness", icon: <Brain className="w-4 h-4" />, color: "bg-purple-500" },
  { id: "exercise", label: "Exercise", icon: <Heart className="w-4 h-4" />, color: "bg-red-500" },
  { id: "nature", label: "Nature", icon: <Leaf className="w-4 h-4" />, color: "bg-green-500" },
  { id: "sleep", label: "Sleep", icon: <Moon className="w-4 h-4" />, color: "bg-indigo-500" },
  { id: "social", label: "Social", icon: <Sun className="w-4 h-4" />, color: "bg-yellow-500" },
  { id: "creativity", label: "Creativity", icon: <Star className="w-4 h-4" />, color: "bg-pink-500" },
];

const sampleTasks = [
  {
    title: "Morning meditation (10 minutes)",
    description: "Start your day with a peaceful 10-minute meditation session",
    category: "mindfulness",
    difficulty: "easy" as const,
    points: 15,
  },
  {
    title: "Take a 15-minute nature walk",
    description: "Step outside and enjoy a refreshing walk in nature",
    category: "nature", 
    difficulty: "easy" as const,
    points: 20,
  },
  {
    title: "Practice gratitude journaling",
    description: "Write down 3 things you're grateful for today",
    category: "mindfulness",
    difficulty: "easy" as const,
    points: 10,
  },
  {
    title: "Do 20 minutes of exercise",
    description: "Engage in physical activity to boost your mood and energy",
    category: "exercise",
    difficulty: "medium" as const,
    points: 25,
  },
  {
    title: "Practice deep breathing exercises",
    description: "Spend 5 minutes doing deep breathing to reduce stress",
    category: "mindfulness",
    difficulty: "easy" as const,
    points: 10,
  },
  {
    title: "Connect with a friend or family member",
    description: "Reach out to someone you care about for meaningful connection",
    category: "social",
    difficulty: "medium" as const,
    points: 20,
  },
  {
    title: "Create something artistic",
    description: "Express yourself through drawing, writing, or any creative activity",
    category: "creativity",
    difficulty: "medium" as const,
    points: 25,
  },
  {
    title: "Establish a bedtime routine",
    description: "Prepare for quality sleep with a calming evening routine",
    category: "sleep",
    difficulty: "medium" as const,
    points: 20,
  },
];

export default function Tasks() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dailyTasks } = useQuery({
    queryKey: ["/api/daily-tasks", { date: selectedDate }],
  });

  const { data: streak } = useQuery({
    queryKey: ["/api/user/streak"],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<DailyTask> }) => {
      const response = await apiRequest("PATCH", `/api/daily-tasks/${taskId}`, updates);
      return response.json();
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/streak"] });
      
      if (updatedTask.completed) {
        // Trigger confetti for task completion
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        toast({
          title: "Task Completed! 🎉",
          description: `Great job! You earned ${updatedTask.points} points.`,
          variant: "default",
        });
      }
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
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStreakMutation = useMutation({
    mutationFn: async (updates: Partial<UserStreak>) => {
      const response = await apiRequest("PATCH", "/api/user/streak", updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/streak"] });
    },
  });

  const generateTasksMutation = useMutation({
    mutationFn: async () => {
      // Generate daily tasks based on sample tasks
      const today = new Date().toISOString();
      const tasksToCreate = sampleTasks.slice(0, 5).map(task => ({
        ...task,
        date: today,
        completed: false,
      }));

      // In a real app, this would be a single API call
      for (const task of tasksToCreate) {
        await apiRequest("POST", "/api/daily-tasks", task);
      }
      
      return tasksToCreate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
      toast({
        title: "Tasks Generated",
        description: "Your daily wellness tasks have been created!",
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
      toast({
        title: "Error",
        description: "Failed to generate tasks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleTask = async (task: DailyTask) => {
    const updates = {
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : undefined,
    };
    
    updateTaskMutation.mutate({ taskId: task.id, updates });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "hard":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = taskCategories.find(c => c.id === category);
    return cat ? cat.icon : <Target className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    const cat = taskCategories.find(c => c.id === category);
    return cat ? cat.color : "bg-gray-500";
  };

  const filteredTasks = dailyTasks?.filter((task: DailyTask) => {
    const matchesCategory = !selectedCategory || task.category === selectedCategory;
    const matchesCompletion = showCompleted || !task.completed;
    return matchesCategory && matchesCompletion;
  }) || [];

  const completedTasks = dailyTasks?.filter((task: DailyTask) => task.completed) || [];
  const totalTasks = dailyTasks?.length || 0;
  const completionPercentage = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
  const totalPointsEarned = completedTasks.reduce((sum, task) => sum + task.points, 0);

  // Generate streak milestone badges
  const getStreakBadges = () => {
    const badges = [];
    const currentStreak = streak?.currentStreak || 0;
    
    if (currentStreak >= 3) badges.push("3-Day Starter");
    if (currentStreak >= 7) badges.push("Week Warrior");
    if (currentStreak >= 14) badges.push("Two Week Champion");
    if (currentStreak >= 30) badges.push("Month Master");
    if (currentStreak >= 100) badges.push("Century Achiever");
    
    return badges;
  };

  const streakBadges = getStreakBadges();

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
          <h1 className="text-4xl font-bold text-foreground mb-4">Daily Wellness Tasks</h1>
          <p className="text-muted-foreground text-lg">
            Complete daily activities to build healthy habits and boost your well-being
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Current Streak</p>
                  <p className="text-3xl font-bold text-primary">{streak?.currentStreak || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Flame className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Best: {streak?.longestStreak || 0} days
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Today's Progress</p>
                  <p className="text-3xl font-bold text-secondary">{completedTasks.length}/{totalTasks}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <Progress value={completionPercentage} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Points Earned</p>
                  <p className="text-3xl font-bold text-accent">{totalPointsEarned}</p>
                </div>
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-accent" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Total: {streak?.totalPoints || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Badges Earned</p>
                  <p className="text-3xl font-bold text-purple-600">{streakBadges.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Keep going! 🏆
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tasks List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Controls */}
            <Card className="glass-effect">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-1 bg-background border border-border rounded"
                        data-testid="input-task-date"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-1 bg-background border border-border rounded"
                      data-testid="select-task-category"
                    >
                      <option value="">All Categories</option>
                      {taskCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <Checkbox
                        checked={showCompleted}
                        onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
                        data-testid="checkbox-show-completed"
                      />
                      <span className="text-sm text-muted-foreground">Show completed</span>
                    </label>
                    {totalTasks === 0 && (
                      <Button
                        onClick={() => generateTasksMutation.mutate()}
                        disabled={generateTasksMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                        data-testid="button-generate-tasks"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {generateTasksMutation.isPending ? "Generating..." : "Generate Tasks"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task List */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Today's Tasks</span>
                  <span className="text-sm text-muted-foreground">
                    {completedTasks.length} of {totalTasks} completed
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <AnimatePresence>
                    {filteredTasks.map((task: DailyTask, index: number) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`p-4 bg-background rounded-lg border-2 transition-all duration-200 ${
                          task.completed ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20' : 'border-border'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <motion.div
                            whileTap={{ scale: 0.9 }}
                            className="mt-1"
                          >
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => toggleTask(task)}
                              className="w-5 h-5"
                              data-testid={`checkbox-task-${task.id}`}
                            />
                          </motion.div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className={`w-6 h-6 ${getCategoryColor(task.category)} rounded-md flex items-center justify-center text-white`}>
                                {getCategoryIcon(task.category)}
                              </div>
                              <h3 className={`font-semibold ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {task.title}
                              </h3>
                              <Badge className={getDifficultyColor(task.difficulty)}>
                                {task.difficulty}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {task.points} pts
                              </Badge>
                            </div>
                            {task.description && (
                              <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                                {task.description}
                              </p>
                            )}
                            {task.completed && task.completedAt && (
                              <div className="flex items-center space-x-2 mt-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  Completed at {new Date(task.completedAt).toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {filteredTasks.length === 0 && (
                    <div className="text-center py-8">
                      <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {totalTasks === 0 ? "No tasks for today" : "No tasks match your filters"}
                      </h3>
                      <p className="text-muted-foreground">
                        {totalTasks === 0 ? 
                          "Generate your daily wellness tasks to get started!" :
                          "Try adjusting your category filter or date selection."
                        }
                      </p>
                    </div>
                  )}
                  
                  {/* Progress Bar */}
                  {totalTasks > 0 && (
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Daily Progress</span>
                        <span className="text-sm text-muted-foreground">{Math.round(completionPercentage)}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-3" />
                      {completionPercentage === 100 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-center mt-4"
                        >
                          <div className="text-2xl mb-2">🎉</div>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">
                            Amazing! You completed all tasks today!
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Streak Information */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span>Streak Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {streak?.currentStreak || 0}
                  </div>
                  <p className="text-muted-foreground">Day Streak</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Best streak</span>
                    <span className="font-medium">{streak?.longestStreak || 0} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total points</span>
                    <span className="font-medium">{streak?.totalPoints || 0}</span>
                  </div>
                </div>

                {/* Streak Milestones */}
                <div>
                  <h4 className="font-medium text-foreground mb-2">Next Milestone</h4>
                  <div className="space-y-2">
                    {[3, 7, 14, 30, 100].map(milestone => {
                      const current = streak?.currentStreak || 0;
                      const isAchieved = current >= milestone;
                      const isCurrent = current < milestone;
                      
                      if (!isCurrent && !isAchieved) return null;
                      
                      return (
                        <div key={milestone} className={`flex items-center space-x-2 text-sm ${
                          isAchieved ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                        }`}>
                          {isAchieved ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                          <span>{milestone} day streak</span>
                          {isCurrent && (
                            <span className="text-xs">({milestone - current} more)</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            {streakBadges.length > 0 && (
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span>Your Badges</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {streakBadges.map((badge, index) => (
                      <motion.div
                        key={badge}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-center p-3 bg-background rounded-lg border"
                      >
                        <div className="text-2xl mb-1">🏆</div>
                        <p className="text-xs font-medium text-foreground">{badge}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Task Categories */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Task Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {taskCategories.map((category) => {
                    const categoryTasks = dailyTasks?.filter((task: DailyTask) => task.category === category.id) || [];
                    const completedCategoryTasks = categoryTasks.filter((task: DailyTask) => task.completed);
                    const percentage = categoryTasks.length > 0 ? (completedCategoryTasks.length / categoryTasks.length) * 100 : 0;
                    
                    return (
                      <div key={category.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 ${category.color} rounded-sm flex items-center justify-center text-white`}>
                              {category.icon}
                            </div>
                            <span className="text-sm font-medium text-foreground">{category.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {completedCategoryTasks.length}/{categoryTasks.length}
                          </span>
                        </div>
                        {categoryTasks.length > 0 && (
                          <Progress value={percentage} className="h-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Weekly Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">This week</span>
                    <span className="font-medium text-foreground">5/7 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tasks completed</span>
                    <span className="font-medium text-foreground">23/30</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Points earned</span>
                    <span className="font-medium text-foreground">485</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
