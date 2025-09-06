import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Video, 
  Headphones, 
  Search, 
  Filter,
  Play,
  Download,
  Eye,
  Clock,
  User,
  Users,
  Heart,
  Star,
  Bookmark,
  Share
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Resource {
  id: string;
  title: string;
  description: string;
  type: "video" | "article" | "audio" | "exercise";
  category: string;
  duration?: string;
  views?: number;
  author?: string;
  rating?: number;
  thumbnail?: string;
  url?: string;
}

// Mock data for resources
const mockResources: Resource[] = [
  {
    id: "1",
    title: "10-Minute Morning Meditation",
    description: "Start your day with mindfulness and intention",
    type: "video",
    category: "mindfulness",
    duration: "10:30",
    views: 12500,
    author: "Dr. Maya Patel",
    rating: 4.8,
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450",
  },
  {
    id: "2",
    title: "Understanding Exam Anxiety",
    description: "Learn about the causes and symptoms of test anxiety and how to manage it effectively.",
    type: "article",
    category: "anxiety",
    duration: "5 min read",
    author: "Dr. Sharma",
    rating: 4.6,
  },
  {
    id: "3",
    title: "Forest Sounds for Deep Sleep",
    description: "Natural soundscape to help you relax and fall asleep",
    type: "audio",
    category: "sleep",
    duration: "Loop",
    views: 8200,
    author: "Nature Sounds",
    rating: 4.9,
    thumbnail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450",
  },
  {
    id: "4",
    title: "Breathing Techniques for Anxiety",
    description: "Learn the 4-7-8 breathing method to manage anxiety",
    type: "video",
    category: "anxiety",
    duration: "8:15",
    views: 9800,
    author: "Wellness Coach",
    rating: 4.7,
    thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450",
  },
  {
    id: "5",
    title: "Progressive Muscle Relaxation",
    description: "Step-by-step tension release technique",
    type: "video",
    category: "stress",
    duration: "12:20",
    views: 6700,
    author: "Therapy Guide",
    rating: 4.5,
    thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450",
  },
  {
    id: "6",
    title: "Building Healthy Sleep Habits",
    description: "Evidence-based strategies for improving sleep quality and establishing a bedtime routine.",
    type: "article",
    category: "sleep",
    duration: "7 min read",
    author: "Dr. Patel",
    rating: 4.4,
  },
];

const playlists = [
  {
    id: "p1",
    title: "Focus & Study",
    description: "Instrumental music to enhance concentration",
    tracks: 24,
    duration: "1h 32m",
    category: "study",
  },
  {
    id: "p2",
    title: "Relaxation Sounds",
    description: "Nature sounds and ambient music",
    tracks: 15,
    duration: "3h 45m",
    category: "relaxation",
  },
  {
    id: "p3",
    title: "Guided Meditations",
    description: "Mindfulness and breathing exercises",
    tracks: 12,
    duration: "2h 15m",
    category: "meditation",
  },
];

const culturalContent = [
  {
    id: "c1",
    title: "Yoga & Asanas",
    description: "Traditional Indian practices for mind-body wellness",
    videos: 8,
    learners: 3200,
    thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
  },
  {
    id: "c2",
    title: "Pranayama Techniques",
    description: "Ancient breathing practices for stress relief",
    guides: 12,
    learners: 5100,
    thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
  },
  {
    id: "c3",
    title: "Meditation & Mindfulness",
    description: "Guided practices rooted in Indian philosophy",
    articles: 15,
    readers: 7800,
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
  },
];

export default function Resources() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredResources = mockResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || resource.category === categoryFilter;
    const matchesType = !typeFilter || resource.type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  const categories = Array.from(new Set(mockResources.map(r => r.category)));
  const types = Array.from(new Set(mockResources.map(r => r.type)));

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "article":
        return <BookOpen className="w-4 h-4" />;
      case "audio":
        return <Headphones className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      case "article":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      case "audio":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">Wellness Resource Hub</h1>
          <p className="text-muted-foreground text-lg">
            Curated content to support your mental health journey
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-resources"
                  />
                </div>
                <div className="flex space-x-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                    data-testid="select-category"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category} className="capitalize">{category}</option>
                    ))}
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                    data-testid="select-type"
                  >
                    <option value="">All Types</option>
                    {types.map(type => (
                      <option key={type} value={type} className="capitalize">{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="all">All Resources</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="cultural">Cultural</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            {/* Featured Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-6">Featured This Week</h2>
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {mockResources.slice(0, 2).map((resource) => (
                      <div key={resource.id} className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden aspect-video bg-muted group cursor-pointer">
                          {resource.thumbnail && (
                            <img 
                              src={resource.thumbnail} 
                              alt={resource.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button size="lg" className="bg-white/90 text-black hover:bg-white">
                              <Play className="w-5 h-5 mr-2" />
                              Play
                            </Button>
                          </div>
                          {resource.duration && (
                            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                              {resource.duration}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getTypeColor(resource.type)}>
                              {getTypeIcon(resource.type)}
                              <span className="ml-1 capitalize">{resource.type}</span>
                            </Badge>
                            <Badge variant="outline" className="capitalize">{resource.category}</Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">{resource.title}</h3>
                          <p className="text-muted-foreground text-sm mb-2">{resource.description}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            {resource.author && (
                              <>
                                <User className="w-4 h-4 mr-1" />
                                <span className="mr-4">{resource.author}</span>
                              </>
                            )}
                            {resource.views && (
                              <>
                                <Eye className="w-4 h-4 mr-1" />
                                <span className="mr-4">{resource.views.toLocaleString()} views</span>
                              </>
                            )}
                            {resource.duration && (
                              <>
                                <Clock className="w-4 h-4 mr-1" />
                                <span>{resource.duration}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* All Resources Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-6">All Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredResources.map((resource, index) => (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="glass-effect card-3d h-full group cursor-pointer">
                        <CardContent className="p-0">
                          {resource.thumbnail && (
                            <div className="relative aspect-video overflow-hidden rounded-t-lg">
                              <img 
                                src={resource.thumbnail} 
                                alt={resource.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Button size="sm" className="bg-white/90 text-black hover:bg-white">
                                  <Play className="w-4 h-4" />
                                </Button>
                              </div>
                              {resource.duration && (
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                  {resource.duration}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="p-4 space-y-3">
                            <div className="flex items-center space-x-2">
                              <Badge className={getTypeColor(resource.type)} size="sm">
                                {getTypeIcon(resource.type)}
                                <span className="ml-1 capitalize">{resource.type}</span>
                              </Badge>
                              <Badge variant="outline" size="sm" className="capitalize">{resource.category}</Badge>
                            </div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {resource.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {resource.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-xs text-muted-foreground">
                                {resource.author && (
                                  <>
                                    <User className="w-3 h-3 mr-1" />
                                    <span>{resource.author}</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {resource.rating && (
                                  <div className="flex items-center">
                                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                    <span className="text-xs text-muted-foreground ml-1">
                                      {resource.rating}
                                    </span>
                                  </div>
                                )}
                                <Button variant="ghost" size="sm" data-testid={`button-bookmark-${resource.id}`}>
                                  <Bookmark className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" data-testid={`button-share-${resource.id}`}>
                                  <Share className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="videos">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockResources.filter(r => r.type === "video").map((resource) => (
                <Card key={resource.id} className="glass-effect card-3d">
                  <CardContent className="p-4 space-y-3">
                    <Badge className={getTypeColor(resource.type)}>
                      <Video className="w-4 h-4 mr-1" />
                      Video
                    </Badge>
                    <h3 className="font-semibold text-foreground">{resource.title}</h3>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{resource.author}</span>
                      <span>{resource.duration}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="articles">
            <div className="space-y-6">
              {mockResources.filter(r => r.type === "article").map((resource) => (
                <Card key={resource.id} className="glass-effect card-3d">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-2">
                          <Badge className={getTypeColor(resource.type)}>Article</Badge>
                          <Badge variant="outline" className="capitalize">{resource.category}</Badge>
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">{resource.title}</h3>
                        <p className="text-muted-foreground">{resource.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{resource.author}</span>
                          <span>{resource.duration}</span>
                          {resource.rating && (
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                              <span>{resource.rating}</span>
                            </div>
                          )}
                        </div>
                        <Button variant="outline" data-testid={`button-read-${resource.id}`}>
                          Read Article
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="audio">
            <div className="space-y-6">
              {/* Playlists */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Curated Playlists</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {playlists.map((playlist) => (
                    <Card key={playlist.id} className="glass-effect card-3d">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Headphones className="w-8 h-8 text-accent" />
                        </div>
                        <h4 className="font-semibold text-foreground mb-2">{playlist.title}</h4>
                        <p className="text-sm text-muted-foreground mb-4">{playlist.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                          <span>{playlist.tracks} tracks</span>
                          <span>{playlist.duration}</span>
                        </div>
                        <Button className="w-full" data-testid={`button-play-playlist-${playlist.id}`}>
                          <Play className="w-4 h-4 mr-2" />
                          Play
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Individual Audio Resources */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Audio Resources</h3>
                <div className="space-y-4">
                  {mockResources.filter(r => r.type === "audio").map((resource) => (
                    <Card key={resource.id} className="glass-effect card-3d">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                            <Headphones className="w-6 h-6 text-secondary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{resource.title}</h4>
                            <p className="text-sm text-muted-foreground">{resource.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" data-testid={`button-play-${resource.id}`}>
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" data-testid={`button-download-${resource.id}`}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cultural">
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Cultural Wellness Practices</h2>
                <p className="text-muted-foreground">
                  Explore traditional practices rooted in Indian culture for holistic well-being
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {culturalContent.map((content, index) => (
                  <motion.div
                    key={content.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="glass-effect card-3d overflow-hidden">
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src={content.thumbnail} 
                          alt={content.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-foreground mb-2">{content.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{content.description}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          {content.videos && (
                            <>
                              <Video className="w-4 h-4 mr-1" />
                              <span className="mr-3">{content.videos} videos</span>
                            </>
                          )}
                          {content.guides && (
                            <>
                              <Headphones className="w-4 h-4 mr-1" />
                              <span className="mr-3">{content.guides} guides</span>
                            </>
                          )}
                          {content.articles && (
                            <>
                              <BookOpen className="w-4 h-4 mr-1" />
                              <span className="mr-3">{content.articles} articles</span>
                            </>
                          )}
                          <Users className="w-4 h-4 mr-1" />
                          <span>
                            {content.learners?.toLocaleString() || content.readers?.toLocaleString()} 
                            {content.learners ? ' learners' : ' readers'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
