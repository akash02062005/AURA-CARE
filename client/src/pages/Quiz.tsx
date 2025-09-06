import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertMoodAssessmentSchema } from "@shared/schema";
import { 
  Brain, 
  Volume2, 
  Languages, 
  ArrowLeft, 
  ArrowRight,
  PieChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

// PHQ-9 Questions for Depression Assessment
const phq9Questions = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed, or the opposite being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself"
];

// GAD-7 Questions for Anxiety Assessment
const gad7Questions = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid, as if something awful might happen"
];

const responseOptions = [
  { value: 0, label: "Not at all", description: "I haven't experienced this", color: "bg-green-500" },
  { value: 1, label: "Several days", description: "Less than half the days", color: "bg-yellow-400" },
  { value: 2, label: "More than half the days", description: "More than half the days in the past 2 weeks", color: "bg-orange-400" },
  { value: 3, label: "Nearly every day", description: "Almost daily in the past 2 weeks", color: "bg-red-500" }
];

type QuizType = "PHQ-9" | "GAD-7";

export default function Quiz() {
  const [currentQuiz, setCurrentQuiz] = useState<QuizType | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: assessments } = useQuery({
    queryKey: ["/api/mood-assessments"],
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertMoodAssessmentSchema>) => {
      const response = await apiRequest("POST", "/api/mood-assessments", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mood-assessments/latest"] });
      setResults(data);
      setShowResults(true);
      
      toast({
        title: "Assessment Complete",
        description: "Your mood assessment has been saved successfully.",
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
        description: "Failed to save assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startQuiz = (type: QuizType) => {
    setCurrentQuiz(type);
    setCurrentQuestion(0);
    setResponses([]);
    setShowResults(false);
    setResults(null);
  };

  const getCurrentQuestions = () => {
    return currentQuiz === "PHQ-9" ? phq9Questions : gad7Questions;
  };

  const handleResponse = (value: number) => {
    const newResponses = [...responses];
    newResponses[currentQuestion] = value;
    setResponses(newResponses);
  };

  const nextQuestion = () => {
    const questions = getCurrentQuestions();
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeQuiz();
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const completeQuiz = () => {
    const totalScore = responses.reduce((sum, score) => sum + score, 0);
    const severity = getSeverity(totalScore, currentQuiz!);
    const recommendations = getRecommendations(severity, currentQuiz!);

    const assessmentData = {
      type: currentQuiz!,
      responses: responses,
      totalScore,
      severity,
      recommendations,
    };

    createAssessmentMutation.mutate(assessmentData);
  };

  const getSeverity = (score: number, type: QuizType) => {
    if (type === "PHQ-9") {
      if (score <= 4) return "minimal";
      if (score <= 9) return "mild";
      if (score <= 14) return "moderate";
      if (score <= 19) return "moderately-severe";
      return "severe";
    } else { // GAD-7
      if (score <= 4) return "minimal";
      if (score <= 9) return "mild";
      if (score <= 14) return "moderate";
      return "severe";
    }
  };

  const getRecommendations = (severity: string, type: QuizType) => {
    const recommendations = [];
    
    if (severity === "minimal") {
      recommendations.push("Continue maintaining your mental wellness routine");
      recommendations.push("Practice mindfulness and stress management techniques");
      recommendations.push("Stay connected with friends and family");
    } else if (severity === "mild") {
      recommendations.push("Try our guided meditation sessions");
      recommendations.push("Engage in regular physical activity");
      recommendations.push("Consider stress-relief games and activities");
    } else if (severity === "moderate") {
      recommendations.push("Consider speaking with a counselor");
      recommendations.push("Practice deep breathing exercises daily");
      recommendations.push("Maintain a consistent sleep schedule");
      recommendations.push("Engage with our peer support community");
    } else {
      recommendations.push("We strongly recommend booking a counseling session");
      recommendations.push("Consider speaking with a healthcare professional");
      recommendations.push("Reach out to crisis support if needed");
      recommendations.push("Use our AI chat for immediate support");
    }

    return recommendations;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minimal":
        return "text-green-600 bg-green-50";
      case "mild":
        return "text-yellow-600 bg-yellow-50";
      case "moderate":
        return "text-orange-600 bg-orange-50";
      case "moderately-severe":
      case "severe":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const questions = getCurrentQuestions();
  const progress = currentQuiz ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  if (showResults && results) {
    return (
      <div className="min-h-screen p-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-effect shadow-2xl">
              <CardHeader className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <PieChart className="w-10 h-10 text-white" />
                </motion.div>
                <CardTitle className="text-3xl font-bold text-foreground mb-2">
                  Your Assessment Results
                </CardTitle>
                <p className="text-muted-foreground text-lg">
                  Based on your {results.type} responses, here's your current wellness snapshot
                </p>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Score Display */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-background rounded-xl border">
                    <h3 className="font-semibold text-muted-foreground mb-2">Total Score</h3>
                    <p className="text-4xl font-bold text-primary">{results.totalScore}</p>
                    <p className="text-sm text-muted-foreground">out of {questions.length * 3}</p>
                  </div>
                  <div className="text-center p-6 bg-background rounded-xl border">
                    <h3 className="font-semibold text-muted-foreground mb-2">Severity Level</h3>
                    <Badge className={`text-lg px-4 py-2 ${getSeverityColor(results.severity)}`}>
                      {results.severity.charAt(0).toUpperCase() + results.severity.slice(1)}
                    </Badge>
                  </div>
                  <div className="text-center p-6 bg-background rounded-xl border">
                    <h3 className="font-semibold text-muted-foreground mb-2">Assessment Type</h3>
                    <p className="text-2xl font-bold text-secondary">{results.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {results.type === "PHQ-9" ? "Depression" : "Anxiety"} Scale
                    </p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-background rounded-xl p-6 border">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 text-primary mr-2" />
                    Personalized Recommendations
                  </h3>
                  <div className="grid gap-3">
                    {results.recommendations.map((recommendation: string, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                        <span className="text-foreground">{recommendation}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => window.location.href = "/chatbot"}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    data-testid="button-ai-support"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Get AI Support
                  </Button>
                  {(results.severity === "moderate" || results.severity === "moderately-severe" || results.severity === "severe") && (
                    <Button
                      onClick={() => window.location.href = "/booking"}
                      className="flex-1 bg-secondary hover:bg-secondary/90"
                      data-testid="button-book-counselor"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Counselor
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentQuiz(null);
                      setShowResults(false);
                    }}
                    className="flex-1"
                    data-testid="button-take-another"
                  >
                    Take Another Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (currentQuiz) {
    return (
      <div className="min-h-screen p-6">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-effect shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentQuiz(null)}
                    data-testid="button-back"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Badge variant="outline" className="text-sm">
                    {currentQuiz} Assessment
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {currentQuestion + 1} of {questions.length}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardHeader>

              <CardContent className="space-y-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Question */}
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground mb-4">
                        Over the last 2 weeks, how often have you been bothered by {questions[currentQuestion].toLowerCase()}?
                      </h2>
                      <p className="text-muted-foreground">
                        Select the answer that best describes your experience
                      </p>
                    </div>

                    {/* Answer Options */}
                    <div className="space-y-4">
                      {responseOptions.map((option) => {
                        const isSelected = responses[currentQuestion] === option.value;
                        return (
                          <motion.label
                            key={option.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center p-4 bg-background border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? 'border-primary shadow-md' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${currentQuestion}`}
                              value={option.value}
                              checked={isSelected}
                              onChange={() => handleResponse(option.value)}
                              className="mr-4 text-primary focus:ring-primary"
                              data-testid={`radio-option-${option.value}`}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-foreground">
                                  {option.label}
                                </span>
                                <div className={`w-4 h-4 ${option.color} rounded-full`} />
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {option.description}
                              </p>
                            </div>
                          </motion.label>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex justify-between items-center pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={previousQuestion}
                    disabled={currentQuestion === 0}
                    data-testid="button-previous"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid="button-text-to-speech"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid="button-translate"
                    >
                      <Languages className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    onClick={nextQuestion}
                    disabled={responses[currentQuestion] === undefined}
                    className="bg-primary hover:bg-primary/90"
                    data-testid="button-next"
                  >
                    {currentQuestion === questions.length - 1 ? "Complete" : "Next"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">Mood Assessment</h1>
          <p className="text-muted-foreground text-lg">
            Take a few minutes to check in with yourself and track your mental wellness
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* PHQ-9 Assessment */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="glass-effect card-3d h-full">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl text-center">Depression Assessment</CardTitle>
                <p className="text-muted-foreground text-center">PHQ-9 Scale</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The Patient Health Questionnaire-9 (PHQ-9) is a validated tool for screening and monitoring depression severity.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 9 questions about mood and interest</li>
                  <li>• Takes about 3-5 minutes</li>
                  <li>• Provides severity scoring</li>
                  <li>• Personalized recommendations</li>
                </ul>
                <Button
                  onClick={() => startQuiz("PHQ-9")}
                  className="w-full bg-primary hover:bg-primary/90"
                  data-testid="button-start-phq9"
                >
                  Start PHQ-9 Assessment
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* GAD-7 Assessment */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="glass-effect card-3d h-full">
              <CardHeader>
                <div className="w-16 h-16 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-secondary" />
                </div>
                <CardTitle className="text-xl text-center">Anxiety Assessment</CardTitle>
                <p className="text-muted-foreground text-center">GAD-7 Scale</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The Generalized Anxiety Disorder-7 (GAD-7) is a validated screening tool for anxiety disorders.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 7 questions about anxiety symptoms</li>
                  <li>• Takes about 2-3 minutes</li>
                  <li>• Measures anxiety severity</li>
                  <li>• Evidence-based recommendations</li>
                </ul>
                <Button
                  onClick={() => startQuiz("GAD-7")}
                  className="w-full bg-secondary hover:bg-secondary/90"
                  data-testid="button-start-gad7"
                >
                  Start GAD-7 Assessment
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Assessment History */}
        {assessments && assessments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Recent Assessments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessments.slice(0, 5).map((assessment: any) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border"
                    >
                      <div>
                        <h4 className="font-medium text-foreground">{assessment.type} Assessment</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(assessment.createdAt).toLocaleDateString()} • Score: {assessment.totalScore}
                        </p>
                      </div>
                      <Badge className={getSeverityColor(assessment.severity)}>
                        {assessment.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
