import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import VirtualPet from "@/components/VirtualPet";
import { Link } from "wouter";
import { 
  Smile, 
  Flame, 
  CheckCircle, 
  MessageCircle, 
  Brain, 
  Gamepad2, 
  BookOpen,
  Quote,
  TrendingUp,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { user } = useAuth();

  const { data: streak } = useQuery({
    queryKey: ["/api/user/streak"],
  });

  const { data: latestMoodAssessment } = useQuery({
    queryKey: ["/api/mood-assessments/latest"],
  });

  const { data: dailyTasks } = useQuery({
    queryKey: ["/api/daily-tasks"],
  });

  const { data: dailyQuote } = useQuery({
    queryKey: ["/api/daily-content"],
  });

  const completedTasks = dailyTasks?.filter(task => task.completed) || [];
  const totalTasks = dailyTasks?.length || 0;
  const completionPercentage = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

  const getMoodScore = () => {
    if (!latestMoodAssessment) return 0;
    // Convert score to 0-100 scale (assuming max score is 27 for PHQ-9)
    return Math.round((1 - latestMoodAssessment.totalScore / 27) * 100);
  };

  const getMoodLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Attention";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const quote = dailyQuote?.[0];

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {getGreeting()}, {user?.firstName || "there"}! 🌅
          </h1>
          <p className="text-muted-foreground text-lg">
            Let's make today a step forward in your wellness journey
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="glass-effect hover:scale-105 transition-transform duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Current Mood</p>
                  <p className="text-2xl font-bold text-secondary">{getMoodLabel(getMoodScore())}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <Smile className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={getMoodScore()} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect hover:scale-105 transition-transform duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Wellness Streak</p>
                  <p className="text-2xl font-bold text-accent">{streak?.currentStreak || 0} Days</p>
                </div>
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Flame className="w-6 h-6 text-accent" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                +{Math.max(0, (streak?.currentStreak || 0) - 5)} from last week
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect hover:scale-105 transition-transform duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Tasks Completed</p>
                  <p className="text-2xl font-bold text-primary">{completedTasks.length}/{totalTasks}</p>
                </div>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {totalTasks - completedTasks.length} remaining today
              </p>
            </CardContent>
          </Card>

          <VirtualPet />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Daily Quote */}
            {quote && (
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Quote className="w-5 h-5 text-primary" />
                    <span>Daily Inspiration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <blockquote className="text-lg text-muted-foreground italic mb-4">
                    "{quote.content}"
                  </blockquote>
                  {quote.author && (
                    <p className="text-sm text-muted-foreground">— {quote.author}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Mood Graph */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Mood Trends (Last 7 Days)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40 bg-muted rounded-lg flex items-end justify-between p-4">
                  {/* Mock chart bars */}
                  {[60, 80, 70, 90, 85, 75, 95].map((height, index) => (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className={`w-8 rounded-t ${
                        index === 6 ? 'bg-primary' : 'bg-secondary'
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/chatbot">
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-primary/10 transition-colors duration-200"
                      data-testid="button-ai-chat"
                    >
                      <MessageCircle className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium">AI Chat</span>
                    </Button>
                  </Link>
                  <Link href="/quiz">
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-secondary/10 transition-colors duration-200"
                      data-testid="button-mood-quiz"
                    >
                      <Brain className="w-6 h-6 text-secondary" />
                      <span className="text-sm font-medium">Mood Quiz</span>
                    </Button>
                  </Link>
                  <Link href="/games">
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-accent/10 transition-colors duration-200"
                      data-testid="button-games"
                    >
                      <Gamepad2 className="w-6 h-6 text-accent" />
                      <span className="text-sm font-medium">Games</span>
                    </Button>
                  </Link>
                  <Link href="/resources">
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors duration-200"
                      data-testid="button-resources"
                    >
                      <BookOpen className="w-6 h-6 text-purple-600" />
                      <span className="text-sm font-medium">Resources</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Today's Tasks */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span>Today's Tasks</span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {completedTasks.length}/{totalTasks}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailyTasks?.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center p-3 bg-background rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        readOnly
                        className="mr-3 text-primary rounded focus:ring-primary"
                        data-testid={`checkbox-task-${task.id}`}
                      />
                      <span
                        className={
                          task.completed
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }
                      >
                        {task.title}
                      </span>
                    </div>
                  ))}
                  {totalTasks === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No tasks for today. Take some time to relax!
                    </p>
                  )}
                </div>
                {totalTasks > 0 && (
                  <div className="mt-4">
                    <Progress value={completionPercentage} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {latestMoodAssessment && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <Brain className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Completed mood assessment</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(latestMoodAssessment.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {completedTasks.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Completed daily tasks</p>
                        <p className="text-xs text-muted-foreground">Today</p>
                      </div>
                    </div>
                  )}
                  {streak && streak.currentStreak > 0 && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                        <Flame className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Maintained wellness streak</p>
                        <p className="text-xs text-muted-foreground">
                          {streak.currentStreak} days strong
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
