import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertFeedbackSchema } from "@shared/schema";
import { 
  MessageSquare, 
  Star, 
  Send, 
  Plus,
  ThumbsUp,
  Bug,
  Lightbulb,
  Heart,
  TrendingUp,
  Calendar,
  User,
  Check,
  Clock,
  AlertCircle,
  Filter,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

interface Feedback {
  id: string;
  type: string;
  rating?: number;
  title?: string;
  content: string;
  category?: string;
  relatedId?: string;
  status: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

const feedbackTypes = [
  { id: "general", label: "General Feedback", icon: <MessageSquare className="w-4 h-4" />, color: "bg-blue-500" },
  { id: "bug", label: "Bug Report", icon: <Bug className="w-4 h-4" />, color: "bg-red-500" },
  { id: "feature", label: "Feature Request", icon: <Lightbulb className="w-4 h-4" />, color: "bg-green-500" },
  { id: "counselor", label: "Counselor Review", icon: <Heart className="w-4 h-4" />, color: "bg-pink-500" },
];

const categories = [
  "App Performance",
  "User Experience", 
  "Content Quality",
  "Technical Issues",
  "Feature Suggestions",
  "Counselor Services",
  "Privacy & Security",
  "Other"
];

export default function Feedback() {
  const [newFeedback, setNewFeedback] = useState({
    type: "general",
    title: "",
    content: "",
    category: "",
    rating: 0,
  });
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: feedbackList } = useQuery({
    queryKey: ["/api/feedback"],
  });

  const createFeedbackMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertFeedbackSchema>) => {
      const response = await apiRequest("POST", "/api/feedback", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      setShowFeedbackForm(false);
      setNewFeedback({
        type: "general",
        title: "",
        content: "",
        category: "",
        rating: 0,
      });
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll review it soon.",
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
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitFeedback = () => {
    if (!newFeedback.content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please provide your feedback content.",
        variant: "destructive",
      });
      return;
    }

    createFeedbackMutation.mutate({
      type: newFeedback.type,
      title: newFeedback.title || undefined,
      content: newFeedback.content,
      category: newFeedback.category || undefined,
      rating: newFeedback.rating > 0 ? newFeedback.rating : undefined,
    });
  };

  const getTypeIcon = (type: string) => {
    const feedbackType = feedbackTypes.find(t => t.id === type);
    return feedbackType ? feedbackType.icon : <MessageSquare className="w-4 h-4" />;
  };

  const getTypeColor = (type: string) => {
    const feedbackType = feedbackTypes.find(t => t.id === type);
    return feedbackType ? feedbackType.color : "bg-gray-500";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "reviewed":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      case "resolved":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "reviewed":
        return <AlertCircle className="w-3 h-3" />;
      case "resolved":
        return <Check className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const filteredFeedback = feedbackList?.filter((feedback: Feedback) => {
    const matchesSearch = feedback.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || feedback.type === selectedType;
    const matchesStatus = !selectedStatus || feedback.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getFeedbackStats = () => {
    if (!feedbackList) return { total: 0, pending: 0, resolved: 0, avgRating: 0 };
    
    const total = feedbackList.length;
    const pending = feedbackList.filter((f: Feedback) => f.status === "pending").length;
    const resolved = feedbackList.filter((f: Feedback) => f.status === "resolved").length;
    const ratedFeedback = feedbackList.filter((f: Feedback) => f.rating);
    const avgRating = ratedFeedback.length > 0 
      ? ratedFeedback.reduce((sum: number, f: Feedback) => sum + (f.rating || 0), 0) / ratedFeedback.length 
      : 0;
    
    return { total, pending, resolved, avgRating };
  };

  const stats = getFeedbackStats();

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
          <h1 className="text-4xl font-bold text-foreground mb-4">Feedback & Support</h1>
          <p className="text-muted-foreground text-lg">
            Share your thoughts, report issues, or suggest improvements to help us serve you better
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
                  <p className="text-muted-foreground text-sm">Total Feedback</p>
                  <p className="text-3xl font-bold text-primary">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Pending Review</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Resolved</p>
                  <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Avg Rating</p>
                  <p className="text-3xl font-bold text-accent">{stats.avgRating.toFixed(1)}</p>
                </div>
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search feedback..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-feedback"
                    />
                  </div>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                    data-testid="select-feedback-type"
                  >
                    <option value="">All Types</option>
                    {feedbackTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                    data-testid="select-feedback-status"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <Dialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90" data-testid="button-new-feedback">
                      <Plus className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Submit Your Feedback</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Feedback Type Selection */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                          What type of feedback is this?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {feedbackTypes.map((type) => (
                            <label
                              key={type.id}
                              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                newFeedback.type === type.id 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="feedback-type"
                                value={type.id}
                                checked={newFeedback.type === type.id}
                                onChange={(e) => setNewFeedback(prev => ({ ...prev, type: e.target.value }))}
                                className="sr-only"
                                data-testid={`radio-feedback-type-${type.id}`}
                              />
                              <div className={`w-8 h-8 ${type.color} rounded-lg flex items-center justify-center text-white mr-3`}>
                                {type.icon}
                              </div>
                              <span className="font-medium text-foreground">{type.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Rating (for certain types) */}
                      {(newFeedback.type === "general" || newFeedback.type === "counselor") && (
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-3">
                            How would you rate your experience?
                          </label>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <motion.button
                                key={star}
                                type="button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onMouseEnter={() => setHoveredStar(star)}
                                onMouseLeave={() => setHoveredStar(0)}
                                onClick={() => setNewFeedback(prev => ({ ...prev, rating: star }))}
                                className="p-1"
                                data-testid={`star-rating-${star}`}
                              >
                                <Star 
                                  className={`w-8 h-8 transition-colors duration-200 ${
                                    star <= (hoveredStar || newFeedback.rating)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Title (Optional)
                        </label>
                        <Input
                          value={newFeedback.title}
                          onChange={(e) => setNewFeedback(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Brief summary of your feedback"
                          data-testid="input-feedback-title"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Category
                        </label>
                        <select
                          value={newFeedback.category}
                          onChange={(e) => setNewFeedback(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                          data-testid="select-feedback-category"
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      {/* Content */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Your Feedback *
                        </label>
                        <Textarea
                          value={newFeedback.content}
                          onChange={(e) => setNewFeedback(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Please share your detailed feedback, suggestions, or describe the issue you're experiencing..."
                          rows={6}
                          data-testid="textarea-feedback-content"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-3">
                        <Button
                          onClick={handleSubmitFeedback}
                          disabled={createFeedbackMutation.isPending}
                          className="flex-1 bg-primary hover:bg-primary/90"
                          data-testid="button-submit-feedback"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {createFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowFeedbackForm(false)}
                          data-testid="button-cancel-feedback"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feedback List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Feedback</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>Your Feedback History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {filteredFeedback.map((feedback: Feedback, index: number) => (
                        <motion.div
                          key={feedback.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="p-4 bg-background rounded-lg border"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 ${getTypeColor(feedback.type)} rounded-lg flex items-center justify-center text-white`}>
                                {getTypeIcon(feedback.type)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">
                                  {feedback.title || `${feedbackTypes.find(t => t.id === feedback.type)?.label || 'Feedback'}`}
                                </h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  {feedback.category && (
                                    <Badge variant="outline" className="text-xs">
                                      {feedback.category}
                                    </Badge>
                                  )}
                                  {feedback.rating && (
                                    <div className="flex items-center">
                                      {Array.from({ length: feedback.rating }, (_, i) => (
                                        <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(feedback.status)}>
                                {getStatusIcon(feedback.status)}
                                <span className="ml-1 capitalize">{feedback.status}</span>
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {getTimeAgo(feedback.createdAt)}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                            {feedback.content}
                          </p>
                          
                          {feedback.adminResponse && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 border-blue-500">
                              <div className="flex items-center space-x-2 mb-2">
                                <User className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                  Team Response
                                </span>
                              </div>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                {feedback.adminResponse}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {filteredFeedback.length === 0 && (
                      <div className="text-center py-12">
                        <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No feedback found</h3>
                        <p className="text-muted-foreground mb-4">
                          {feedbackList?.length === 0 
                            ? "You haven't submitted any feedback yet." 
                            : "No feedback matches your current filters."
                          }
                        </p>
                        <Button
                          onClick={() => setShowFeedbackForm(true)}
                          className="bg-primary hover:bg-primary/90"
                          data-testid="button-submit-first-feedback"
                        >
                          Submit Your First Feedback
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending">
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>Pending Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {feedbackList?.filter((f: Feedback) => f.status === "pending").map((feedback: Feedback) => (
                      <div key={feedback.id} className="p-4 bg-background rounded-lg border border-yellow-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium text-foreground">
                            {feedback.title || `${feedbackTypes.find(t => t.id === feedback.type)?.label || 'Feedback'}`}
                          </span>
                          <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {feedback.content}
                        </p>
                      </div>
                    )) || (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No pending feedback</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviewed">
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>Under Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {feedbackList?.filter((f: Feedback) => f.status === "reviewed").map((feedback: Feedback) => (
                      <div key={feedback.id} className="p-4 bg-background rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-foreground">
                            {feedback.title || `${feedbackTypes.find(t => t.id === feedback.type)?.label || 'Feedback'}`}
                          </span>
                          <Badge className="bg-blue-100 text-blue-700">Reviewed</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {feedback.content}
                        </p>
                      </div>
                    )) || (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No feedback under review</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resolved">
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>Resolved Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {feedbackList?.filter((f: Feedback) => f.status === "resolved").map((feedback: Feedback) => (
                      <div key={feedback.id} className="p-4 bg-background rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-foreground">
                            {feedback.title || `${feedbackTypes.find(t => t.id === feedback.type)?.label || 'Feedback'}`}
                          </span>
                          <Badge className="bg-green-100 text-green-700">Resolved</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {feedback.content}
                        </p>
                        {feedback.adminResponse && (
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border-l-4 border-green-500">
                            <p className="text-sm text-green-800 dark:text-green-200">
                              <strong>Resolution:</strong> {feedback.adminResponse}
                            </p>
                          </div>
                        )}
                      </div>
                    )) || (
                      <div className="text-center py-8">
                        <Check className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No resolved feedback yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
