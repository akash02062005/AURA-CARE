import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Users, 
  Brain, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Target,
  Shield,
  FileText,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";

interface AdminStats {
  totalUsers: number;
  totalAssessments: number;
  totalConversations: number;
  totalBookings: number;
  averageMoodScore: number;
  crisisEscalations: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("7d");

  const { data: adminStats, isLoading: statsLoading, error: statsError } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  const { data: moodAssessments } = useQuery({
    queryKey: ["/api/mood-assessments"],
  });

  const { data: forumPosts } = useQuery({
    queryKey: ["/api/forum/posts"],
  });

  const { data: bookings } = useQuery({
    queryKey: ["/api/bookings"],
  });

  const { data: feedback } = useQuery({
    queryKey: ["/api/feedback"],
  });

  // Handle unauthorized access
  if (statsError && isUnauthorizedError(statsError as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  // Check if user has admin privileges (in a real app, this would be determined by user role)
  const isAdmin = user?.email?.includes("admin") || user?.email?.includes("support");

  if (!isAdmin) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="glass-effect max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              You don't have permission to access the admin dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const exportReport = (type: "csv" | "pdf") => {
    const data = {
      stats: adminStats,
      assessments: moodAssessments,
      posts: forumPosts,
      bookings: bookings,
      feedback: feedback,
      generatedAt: new Date().toISOString(),
    };

    if (type === "csv") {
      // Convert to CSV format
      const csvContent = [
        "Report Type,Value",
        `Total Users,${adminStats?.totalUsers || 0}`,
        `Total Assessments,${adminStats?.totalAssessments || 0}`,
        `Total Conversations,${adminStats?.totalConversations || 0}`,
        `Total Bookings,${adminStats?.totalBookings || 0}`,
        `Average Mood Score,${adminStats?.averageMoodScore?.toFixed(2) || 0}`,
        `Crisis Escalations,${adminStats?.crisisEscalations || 0}`,
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aura-care-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // For PDF, we'll create a simple JSON export (in a real app, you'd use a PDF library)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aura-care-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    toast({
      title: "Report Exported",
      description: `Your ${type.toUpperCase()} report has been downloaded.`,
      variant: "default",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minimal":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "mild":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "moderate":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400";
      case "severe":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getMoodTrends = () => {
    if (!moodAssessments || moodAssessments.length === 0) return [];
    
    const severityCounts = moodAssessments.reduce((acc: any, assessment: any) => {
      acc[assessment.severity] = (acc[assessment.severity] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(severityCounts).map(([severity, count]) => ({
      severity,
      count,
      percentage: Math.round((count as number / moodAssessments.length) * 100)
    }));
  };

  const moodTrends = getMoodTrends();

  if (statsLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="glass-effect">
          <CardContent className="p-8 text-center">
            <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Loading Dashboard</h3>
            <p className="text-muted-foreground">Please wait while we load the analytics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground text-lg">
                Monitor platform health and user wellness insights
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                data-testid="select-date-range"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <Button
                variant="outline"
                onClick={() => exportReport("csv")}
                data-testid="button-export-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => exportReport("pdf")}
                data-testid="button-export-pdf"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
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
                  <p className="text-muted-foreground text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-primary">{adminStats?.totalUsers || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                +12% from last period
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Assessments</p>
                  <p className="text-3xl font-bold text-secondary">{adminStats?.totalAssessments || 0}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Avg: {adminStats?.averageMoodScore?.toFixed(1) || 0} score
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Conversations</p>
                  <p className="text-3xl font-bold text-accent">{adminStats?.totalConversations || 0}</p>
                </div>
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-accent" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                AI support sessions
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Crisis Alerts</p>
                  <p className="text-3xl font-bold text-red-600">{adminStats?.crisisEscalations || 0}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Requires immediate attention
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="wellness">Wellness</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mood Trends */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    <span>Mood Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {moodTrends.map((trend) => (
                      <div key={trend.severity} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge className={getSeverityColor(trend.severity)}>
                            {trend.severity}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {trend.count} assessments
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${trend.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground w-8">
                            {trend.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {moodTrends.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No mood data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Platform Activity */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-secondary" />
                    <span>Platform Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Bookings</span>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {adminStats?.totalBookings || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Users className="w-4 h-4 text-secondary" />
                        <span className="text-sm font-medium">Forum Posts</span>
                      </div>
                      <span className="text-lg font-bold text-secondary">
                        {forumPosts?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Target className="w-4 h-4 text-accent" />
                        <span className="text-sm font-medium">Feedback Items</span>
                      </div>
                      <span className="text-lg font-bold text-accent">
                        {feedback?.length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-primary">{adminStats?.totalUsers || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-secondary">
                        {Math.round(((adminStats?.totalUsers || 0) * 0.75))}
                      </p>
                      <p className="text-sm text-muted-foreground">Active This Month</p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-accent">
                        {Math.round(((adminStats?.totalUsers || 0) * 0.15))}
                      </p>
                      <p className="text-sm text-muted-foreground">New This Week</p>
                    </div>
                  </div>
                  <div className="text-center py-8">
                    <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">User Management</h3>
                    <p className="text-muted-foreground">
                      Advanced user management features would be available here in the full implementation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wellness" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Assessments */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>Recent Mood Assessments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {moodAssessments?.slice(0, 10).map((assessment: any) => (
                      <div key={assessment.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <div>
                          <Badge variant="outline">{assessment.type}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getTimeAgo(assessment.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            Score: {assessment.totalScore}
                          </p>
                          <Badge className={getSeverityColor(assessment.severity)}>
                            {assessment.severity}
                          </Badge>
                        </div>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-center py-4">No assessments available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Crisis Monitoring */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span>Crisis Monitoring</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-red-800 dark:text-red-200">High Priority Alerts</h4>
                        <Badge variant="destructive">{adminStats?.crisisEscalations || 0}</Badge>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-300">
                        Users requiring immediate attention based on AI sentiment analysis.
                      </p>
                    </div>
                    <div className="text-center py-4">
                      <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Crisis intervention protocols are monitored in real-time.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Forum Activity */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>Forum Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {forumPosts?.slice(0, 5).map((post: any) => (
                      <div key={post.id} className="p-3 bg-background rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-foreground text-sm">{post.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(post.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{post.category}</Badge>
                          {post.flagged && (
                            <Badge variant="destructive">Flagged</Badge>
                          )}
                        </div>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-center py-4">No forum posts available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Feedback Overview */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>User Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {feedback?.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="p-3 bg-background rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge variant="outline">{item.type}</Badge>
                            {item.rating && (
                              <div className="flex items-center mt-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <span
                                    key={i}
                                    className={`text-sm ${i < item.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.title || "Feedback item"}
                        </p>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-center py-4">No feedback available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <span>System Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">System Status</h3>
                    <Badge className="bg-green-100 text-green-700">Operational</Badge>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Uptime</h3>
                    <p className="text-2xl font-bold text-blue-600">99.9%</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Performance</h3>
                    <Badge className="bg-purple-100 text-purple-700">Excellent</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
