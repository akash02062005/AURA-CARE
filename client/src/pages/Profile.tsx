import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import VirtualPet from "@/components/VirtualPet";
import { 
  User, 
  Edit, 
  Save, 
  X, 
  MapPin, 
  Calendar, 
  Mail,
  Trophy,
  Heart,
  Brain,
  Star,
  Award,
  Shield,
  Trash2,
  Download,
  Settings,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    locality: "",
    country: "",
    interests: [] as string[],
  });
  const [newInterest, setNewInterest] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: moodAssessments } = useQuery({
    queryKey: ["/api/mood-assessments"],
  });

  const { data: gameScores } = useQuery({
    queryKey: ["/api/game-scores"],
  });

  const { data: streak } = useQuery({
    queryKey: ["/api/user/streak"],
  });

  const { data: feedback } = useQuery({
    queryKey: ["/api/feedback"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", "/api/auth/user", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
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
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/auth/user");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
        variant: "default",
      });
      setTimeout(() => {
        window.location.href = "/api/logout";
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startEditing = () => {
    setEditForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      age: user?.age?.toString() || "",
      gender: user?.gender || "",
      locality: user?.locality || "",
      country: user?.country || "",
      interests: user?.interests || [],
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({
      firstName: "",
      lastName: "",
      age: "",
      gender: "",
      locality: "",
      country: "",
      interests: [],
    });
  };

  const saveProfile = () => {
    updateProfileMutation.mutate({
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      age: editForm.age ? parseInt(editForm.age) : undefined,
      gender: editForm.gender,
      locality: editForm.locality,
      country: editForm.country,
      interests: editForm.interests,
    });
  };

  const addInterest = () => {
    if (newInterest.trim() && !editForm.interests.includes(newInterest.trim())) {
      setEditForm(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setEditForm(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const downloadData = () => {
    const userData = {
      profile: user,
      moodAssessments,
      gameScores,
      streak,
      feedback,
    };
    
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aura-care-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Downloaded",
      description: "Your data has been downloaded successfully.",
      variant: "default",
    });
  };

  const confirmDeleteAccount = () => {
    if (window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
      deleteAccountMutation.mutate();
    }
  };

  const getBadges = () => {
    const badges = [];
    
    if (streak?.currentStreak && streak.currentStreak >= 7) {
      badges.push({ name: "Week Warrior", icon: "🔥", description: "7-day streak" });
    }
    if (streak?.currentStreak && streak.currentStreak >= 30) {
      badges.push({ name: "Month Master", icon: "🏆", description: "30-day streak" });
    }
    if (moodAssessments && moodAssessments.length >= 10) {
      badges.push({ name: "Self-Aware", icon: "🧠", description: "10+ mood assessments" });
    }
    if (gameScores && gameScores.length >= 5) {
      badges.push({ name: "Game Explorer", icon: "🎮", description: "Played 5+ games" });
    }
    if (feedback && feedback.length >= 3) {
      badges.push({ name: "Feedback Champion", icon: "⭐", description: "Provided helpful feedback" });
    }
    
    return badges;
  };

  const getJoinDate = () => {
    if (user?.createdAt) {
      return new Date(user.createdAt).toLocaleDateString();
    }
    return "Unknown";
  };

  const getMoodTrend = () => {
    if (!moodAssessments || moodAssessments.length === 0) return "No data";
    
    const recent = moodAssessments.slice(0, 5);
    const averageScore = recent.reduce((sum: number, assessment: any) => sum + assessment.totalScore, 0) / recent.length;
    
    if (averageScore < 5) return "Improving";
    if (averageScore < 10) return "Stable";
    if (averageScore < 15) return "Concerning";
    return "Needs attention";
  };

  const badges = getBadges();

  if (!user) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="glass-effect">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Loading Profile</h3>
            <p className="text-muted-foreground">Please wait while we load your profile...</p>
          </CardContent>
        </Card>
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
          className="mb-8"
        >
          <Card className="glass-effect">
            <CardContent className="p-8">
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                  {user.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">
                        {user.firstName || user.lastName ? 
                          `${user.firstName || ""} ${user.lastName || ""}`.trim() : 
                          "Welcome to Aura Care"
                        }
                      </h1>
                      <div className="flex items-center space-x-4 text-muted-foreground mt-2">
                        {user.email && (
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            <span>{user.email}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Joined {getJoinDate()}</span>
                        </div>
                        {user.locality && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{user.locality}, {user.country}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={isEditing ? cancelEditing : startEditing}
                      variant={isEditing ? "outline" : "default"}
                      data-testid="button-edit-profile"
                    >
                      {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                      {isEditing ? "Cancel" : "Edit Profile"}
                    </Button>
                  </div>
                  
                  {/* Interests */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {(user.interests || []).map((interest) => (
                        <Badge key={interest} variant="secondary">{interest}</Badge>
                      ))}
                      {(!user.interests || user.interests.length === 0) && (
                        <p className="text-muted-foreground text-sm">No interests added yet</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-primary">{streak?.currentStreak || 0}</p>
                      <p className="text-xs text-muted-foreground">Day Streak</p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-secondary">{moodAssessments?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Assessments</p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-accent">{badges.length}</p>
                      <p className="text-xs text-muted-foreground">Badges</p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{getMoodTrend()}</p>
                      <p className="text-xs text-muted-foreground">Mood Trend</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit Form */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        First Name
                      </label>
                      <Input
                        value={editForm.firstName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Enter your first name"
                        data-testid="input-first-name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Last Name
                      </label>
                      <Input
                        value={editForm.lastName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Enter your last name"
                        data-testid="input-last-name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Age
                      </label>
                      <Input
                        type="number"
                        value={editForm.age}
                        onChange={(e) => setEditForm(prev => ({ ...prev, age: e.target.value }))}
                        placeholder="Enter your age"
                        data-testid="input-age"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Gender
                      </label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                        data-testid="select-gender"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non-binary">Non-binary</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Locality
                      </label>
                      <Input
                        value={editForm.locality}
                        onChange={(e) => setEditForm(prev => ({ ...prev, locality: e.target.value }))}
                        placeholder="Enter your city/locality"
                        data-testid="input-locality"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Country
                      </label>
                      <Input
                        value={editForm.country}
                        onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="Enter your country"
                        data-testid="input-country"
                      />
                    </div>
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Interests
                    </label>
                    <div className="flex space-x-2 mb-3">
                      <Input
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        placeholder="Add an interest"
                        onKeyPress={(e) => e.key === "Enter" && addInterest()}
                        data-testid="input-new-interest"
                      />
                      <Button onClick={addInterest} data-testid="button-add-interest">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editForm.interests.map((interest) => (
                        <Badge key={interest} variant="secondary" className="cursor-pointer">
                          {interest}
                          <X
                            className="w-3 h-3 ml-1"
                            onClick={() => removeInterest(interest)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={saveProfile}
                      disabled={updateProfileMutation.isPending}
                      className="bg-primary hover:bg-primary/90"
                      data-testid="button-save-profile"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={cancelEditing} data-testid="button-cancel-edit">
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="pet">Virtual Pet</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Wellness Overview */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span>Wellness Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-background rounded-lg">
                      <p className="text-lg font-bold text-primary">{streak?.longestStreak || 0}</p>
                      <p className="text-sm text-muted-foreground">Longest Streak</p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg">
                      <p className="text-lg font-bold text-secondary">{streak?.totalPoints || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Points</p>
                    </div>
                  </div>
                  {moodAssessments && moodAssessments.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Recent Assessment</h4>
                      <div className="bg-background rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">
                          Last assessment: {new Date(moodAssessments[0].createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-foreground">
                          Severity: <Badge>{moodAssessments[0].severity}</Badge>
                        </p>
                      </div>
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
                    {moodAssessments && moodAssessments.slice(0, 3).map((assessment: any) => (
                      <div key={assessment.id} className="flex items-center space-x-3 p-3 bg-background rounded-lg">
                        <Brain className="w-4 h-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Completed {assessment.type} assessment</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(assessment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">{assessment.severity}</Badge>
                      </div>
                    ))}
                    {(!moodAssessments || moodAssessments.length === 0) && (
                      <p className="text-muted-foreground text-center py-4">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span>Your Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.map((badge, index) => (
                    <motion.div
                      key={badge.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="text-center p-4 bg-background rounded-lg border"
                    >
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <h3 className="font-semibold text-foreground">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                    </motion.div>
                  ))}
                  {badges.length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No badges yet</h3>
                      <p className="text-muted-foreground">
                        Complete activities to earn your first badge!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mood History */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>Mood Assessment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {moodAssessments?.map((assessment: any) => (
                      <div key={assessment.id} className="p-3 bg-background rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline">{assessment.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(assessment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground">Score: {assessment.totalScore}</span>
                          <Badge className={
                            assessment.severity === "minimal" ? "bg-green-100 text-green-700" :
                            assessment.severity === "mild" ? "bg-yellow-100 text-yellow-700" :
                            assessment.severity === "moderate" ? "bg-orange-100 text-orange-700" :
                            "bg-red-100 text-red-700"
                          }>
                            {assessment.severity}
                          </Badge>
                        </div>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-center py-4">No assessments completed yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Game History */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>Game History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {gameScores?.map((score: any) => (
                      <div key={score.id} className="p-3 bg-background rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="capitalize">{score.gameType}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(score.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground">Score: {score.score}</span>
                          <Badge variant="secondary" className="capitalize">{score.difficulty}</Badge>
                        </div>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-center py-4">No games played yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pet" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VirtualPet />
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>Pet Care Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Heart className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Keep Your Pet Happy</h4>
                        <p className="text-sm text-muted-foreground">
                          Complete daily tasks and maintain your wellness streak to keep your pet happy and healthy.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Level Up Together</h4>
                        <p className="text-sm text-muted-foreground">
                          Your pet grows and evolves as you progress in your mental wellness journey.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Trophy className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Earn Rewards</h4>
                        <p className="text-sm text-muted-foreground">
                          Playing games and engaging with the community helps your pet gain experience and unlock new features.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account Settings */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Account Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Language</h4>
                        <p className="text-sm text-muted-foreground">Choose your preferred language</p>
                      </div>
                      <select
                        defaultValue={user?.language || "en"}
                        className="px-3 py-1 bg-background border border-border rounded"
                        data-testid="select-language"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Dark Mode</h4>
                        <p className="text-sm text-muted-foreground">Toggle dark theme</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Privacy & Data */}
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Privacy & Data</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={downloadData}
                    className="w-full justify-start"
                    data-testid="button-download-data"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download My Data
                  </Button>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground text-red-600">Danger Zone</h4>
                    <Button
                      variant="destructive"
                      onClick={confirmDeleteAccount}
                      disabled={deleteAccountMutation.isPending}
                      className="w-full justify-start"
                      data-testid="button-delete-account"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
