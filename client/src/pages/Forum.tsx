import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertForumPostSchema, insertForumReplySchema } from "@shared/schema";
import { 
  MessageSquare, 
  Users, 
  Heart, 
  Flag, 
  Reply, 
  ChevronDown,
  ChevronUp,
  Send,
  Plus,
  TrendingUp,
  Clock,
  User,
  Eye,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  anonymous: boolean;
  upvotes: number;
  downvotes: number;
  flagged: boolean;
  createdAt: string;
  updatedAt: string;
  replyCount?: number;
}

interface ForumReply {
  id: string;
  postId: string;
  content: string;
  anonymous: boolean;
  upvotes: number;
  downvotes: number;
  flagged: boolean;
  createdAt: string;
  updatedAt: string;
}

const categories = [
  "General Support",
  "Anxiety & Stress",
  "Depression",
  "Academic Pressure",
  "Sleep Issues",
  "Social Support",
  "Success Stories",
  "Tips & Advice"
];

export default function Forum() {
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("General Support");
  const [newPostAnonymous, setNewPostAnonymous] = useState(true);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyAnonymous, setReplyAnonymous] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Real-time WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("Forum WebSocket connected");
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "forum_update") {
          queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    wsRef.current.onclose = () => {
      console.log("Forum WebSocket disconnected");
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient]);

  const { data: posts } = useQuery({
    queryKey: ["/api/forum/posts"],
  });

  const { data: replies } = useQuery({
    queryKey: ["/api/forum/posts", selectedPost, "replies"],
    enabled: !!selectedPost,
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertForumPostSchema>) => {
      const response = await apiRequest("POST", "/api/forum/posts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostCategory("General Support");
      setShowNewPostForm(false);
      
      // Broadcast update via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "forum_update" }));
      }
      
      toast({
        title: "Post Created",
        description: "Your post has been shared with the community.",
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
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async ({ postId, data }: { postId: string; data: z.infer<typeof insertForumReplySchema> }) => {
      const response = await apiRequest("POST", `/api/forum/posts/${postId}/replies`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts", selectedPost, "replies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      setReplyContent("");
      
      // Broadcast update via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "forum_update" }));
      }
      
      toast({
        title: "Reply Posted",
        description: "Your reply has been added to the discussion.",
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
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and content for your post.",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      title: newPostTitle,
      content: newPostContent,
      category: newPostCategory,
      anonymous: newPostAnonymous,
    });
  };

  const handleCreateReply = () => {
    if (!selectedPost || !replyContent.trim()) {
      toast({
        title: "Missing Information",
        description: "Please write a reply before posting.",
        variant: "destructive",
      });
      return;
    }

    createReplyMutation.mutate({
      postId: selectedPost,
      data: {
        content: replyContent,
        anonymous: replyAnonymous,
      },
    });
  };

  const toggleReplies = (postId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
      setSelectedPost(null);
    } else {
      newExpanded.add(postId);
      setSelectedPost(postId);
    }
    setExpandedReplies(newExpanded);
  };

  const filteredPosts = posts?.filter((post: ForumPost) => {
    return !categoryFilter || post.category === categoryFilter;
  }).sort((a: ForumPost, b: ForumPost) => {
    if (sortBy === "recent") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === "popular") {
      return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
    }
    return 0;
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
          <h1 className="text-4xl font-bold text-foreground mb-4">Peer Support Forum</h1>
          <p className="text-muted-foreground text-lg">
            A safe space to share experiences, support each other, and find community
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                    data-testid="select-category-filter"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                    data-testid="select-sort-by"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
                <Button
                  onClick={() => setShowNewPostForm(!showNewPostForm)}
                  className="bg-primary hover:bg-primary/90"
                  data-testid="button-new-post"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* New Post Form */}
        <AnimatePresence>
          {showNewPostForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>Share Your Thoughts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Input
                      placeholder="Post title..."
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      data-testid="input-post-title"
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="What's on your mind? Share your thoughts, ask for advice, or offer support..."
                      rows={4}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      data-testid="textarea-post-content"
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value)}
                      className="px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                      data-testid="select-post-category"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newPostAnonymous}
                        onChange={(e) => setNewPostAnonymous(e.target.checked)}
                        className="rounded focus:ring-primary"
                        data-testid="checkbox-post-anonymous"
                      />
                      <span className="text-sm text-muted-foreground">Post anonymously</span>
                    </label>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleCreatePost}
                      disabled={createPostMutation.isPending}
                      className="bg-primary hover:bg-primary/90"
                      data-testid="button-submit-post"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {createPostMutation.isPending ? "Posting..." : "Post"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewPostForm(false)}
                      data-testid="button-cancel-post"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts List */}
        <div className="space-y-6">
          {filteredPosts.length === 0 ? (
            <Card className="glass-effect">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No posts found</h3>
                <p className="text-muted-foreground">
                  {categoryFilter ? "No posts in this category yet." : "Be the first to start a discussion!"}
                </p>
                <Button
                  onClick={() => setShowNewPostForm(true)}
                  className="mt-4"
                  data-testid="button-start-discussion"
                >
                  Start Discussion
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {filteredPosts.map((post: ForumPost, index: number) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="glass-effect card-3d">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Post Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline">{post.category}</Badge>
                              {post.flagged && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Flagged
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                              {post.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                <span>{post.anonymous ? "Anonymous" : "User"}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>{getTimeAgo(post.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" data-testid={`button-flag-${post.id}`}>
                              <Flag className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Post Content */}
                        <div className="prose prose-sm max-w-none">
                          <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                        </div>

                        <Separator />

                        {/* Post Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" data-testid={`button-upvote-${post.id}`}>
                                <motion.div whileTap={{ scale: 0.9 }}>
                                  <Heart className="w-4 h-4 mr-1" />
                                </motion.div>
                                {post.upvotes}
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleReplies(post.id)}
                              data-testid={`button-replies-${post.id}`}
                            >
                              <Reply className="w-4 h-4 mr-1" />
                              {post.replyCount || 0} replies
                              {expandedReplies.has(post.id) ? (
                                <ChevronUp className="w-4 h-4 ml-1" />
                              ) : (
                                <ChevronDown className="w-4 h-4 ml-1" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Replies Section */}
                        <AnimatePresence>
                          {expandedReplies.has(post.id) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-4 pt-4 border-t border-border"
                            >
                              {/* Reply Form */}
                              <div className="bg-background rounded-lg p-4 space-y-3">
                                <Textarea
                                  placeholder="Share your thoughts or offer support..."
                                  rows={3}
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  data-testid={`textarea-reply-${post.id}`}
                                />
                                <div className="flex items-center justify-between">
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={replyAnonymous}
                                      onChange={(e) => setReplyAnonymous(e.target.checked)}
                                      className="rounded focus:ring-primary"
                                      data-testid={`checkbox-reply-anonymous-${post.id}`}
                                    />
                                    <span className="text-sm text-muted-foreground">Reply anonymously</span>
                                  </label>
                                  <Button
                                    onClick={handleCreateReply}
                                    disabled={createReplyMutation.isPending || !replyContent.trim()}
                                    size="sm"
                                    data-testid={`button-submit-reply-${post.id}`}
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    Reply
                                  </Button>
                                </div>
                              </div>

                              {/* Existing Replies */}
                              {replies && replies.length > 0 ? (
                                <div className="space-y-3">
                                  {replies.map((reply: ForumReply) => (
                                    <motion.div
                                      key={reply.id}
                                      initial={{ opacity: 0, x: 20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="bg-muted/50 rounded-lg p-4 ml-4"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                          <User className="w-3 h-3" />
                                          <span>{reply.anonymous ? "Anonymous" : "User"}</span>
                                          <span>•</span>
                                          <span>{getTimeAgo(reply.createdAt)}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" data-testid={`button-flag-reply-${reply.id}`}>
                                          <Flag className="w-3 h-3" />
                                        </Button>
                                      </div>
                                      <p className="text-foreground text-sm whitespace-pre-wrap">
                                        {reply.content}
                                      </p>
                                      <div className="flex items-center space-x-2 mt-3">
                                        <Button variant="ghost" size="sm" data-testid={`button-upvote-reply-${reply.id}`}>
                                          <motion.div whileTap={{ scale: 0.9 }}>
                                            <Heart className="w-3 h-3 mr-1" />
                                          </motion.div>
                                          {reply.upvotes}
                                        </Button>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6 text-muted-foreground">
                                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p>No replies yet. Be the first to respond!</p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
