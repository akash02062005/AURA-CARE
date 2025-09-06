import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertFeelGoodPlaceSchema } from "@shared/schema";
import { 
  MapPin, 
  Plus, 
  Search, 
  Filter,
  Star,
  Coffee,
  Trees,
  Book,
  Dumbbell,
  Music,
  Camera,
  Heart,
  Navigation,
  Phone,
  Clock,
  Users,
  Share,
  Bookmark
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

interface FeelGoodPlace {
  id: string;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  imageUrl?: string;
  amenities: string[];
  createdAt: string;
}

const categories = [
  { id: "park", label: "Parks", icon: <Trees className="w-4 h-4" />, color: "bg-green-500" },
  { id: "cafe", label: "Cafés", icon: <Coffee className="w-4 h-4" />, color: "bg-brown-500" },
  { id: "library", label: "Libraries", icon: <Book className="w-4 h-4" />, color: "bg-blue-500" },
  { id: "gym", label: "Gyms", icon: <Dumbbell className="w-4 h-4" />, color: "bg-red-500" },
  { id: "music", label: "Music Venues", icon: <Music className="w-4 h-4" />, color: "bg-purple-500" },
  { id: "art", label: "Art Galleries", icon: <Camera className="w-4 h-4" />, color: "bg-pink-500" },
];

const amenities = [
  "Free WiFi", "Parking", "Wheelchair Accessible", "Pet Friendly", 
  "Quiet Zones", "Outdoor Seating", "Study Areas", "Restrooms"
];

export default function Map() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<FeelGoodPlace | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [newPlace, setNewPlace] = useState({
    name: "",
    description: "",
    category: "park",
    address: "",
    amenities: [] as string[],
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: places } = useQuery({
    queryKey: ["/api/places"],
  });

  const createPlaceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertFeelGoodPlaceSchema>) => {
      const response = await apiRequest("POST", "/api/places", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      setShowAddForm(false);
      setNewPlace({
        name: "",
        description: "",
        category: "park",
        address: "",
        amenities: [],
      });
      toast({
        title: "Place Added",
        description: "Your feel-good place has been added to the map!",
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
        description: "Failed to add place. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Location access denied:", error);
          // Default to Mumbai coordinates if location is denied
          setUserLocation({ lat: 19.0760, lng: 72.8777 });
        }
      );
    } else {
      setUserLocation({ lat: 19.0760, lng: 72.8777 });
    }
  }, []);

  const handleAddPlace = () => {
    if (!newPlace.name.trim() || !newPlace.address.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide place name and address.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, you'd geocode the address to get coordinates
    // For now, we'll use the user's location with a small offset
    const lat = userLocation ? userLocation.lat + (Math.random() - 0.5) * 0.01 : 19.0760;
    const lng = userLocation ? userLocation.lng + (Math.random() - 0.5) * 0.01 : 72.8777;

    createPlaceMutation.mutate({
      name: newPlace.name,
      description: newPlace.description,
      category: newPlace.category,
      latitude: lat,
      longitude: lng,
      address: newPlace.address,
      amenities: newPlace.amenities,
    });
  };

  const toggleAmenity = (amenity: string) => {
    setNewPlace(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const filteredPlaces = places?.filter((place: FeelGoodPlace) => {
    const matchesSearch = place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         place.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || place.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.icon : <MapPin className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.color : "bg-gray-500";
  };

  const openDirections = (place: FeelGoodPlace) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    window.open(url, '_blank');
  };

  const sharePlace = async (place: FeelGoodPlace) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: place.name,
          text: place.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${place.name}: ${place.description}`);
      toast({
        title: "Copied to clipboard",
        description: "Place details copied to clipboard",
        variant: "default",
      });
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
          <h1 className="text-4xl font-bold text-foreground mb-4">Feel-Good Places</h1>
          <p className="text-muted-foreground text-lg">
            Discover and share places that boost your mood and well-being
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
                    placeholder="Search places..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-places"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedCategory === "" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory("")}
                      data-testid="button-all-categories"
                    >
                      All Places
                    </Button>
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className="flex items-center space-x-1"
                        data-testid={`button-category-${category.id}`}
                      >
                        {category.icon}
                        <span>{category.label}</span>
                      </Button>
                    ))}
                  </div>
                  <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90" data-testid="button-add-place">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Place
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add a Feel-Good Place</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Place Name
                          </label>
                          <Input
                            value={newPlace.name}
                            onChange={(e) => setNewPlace(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter place name"
                            data-testid="input-place-name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Category
                          </label>
                          <select
                            value={newPlace.category}
                            onChange={(e) => setNewPlace(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                            data-testid="select-place-category"
                          >
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Address
                          </label>
                          <Input
                            value={newPlace.address}
                            onChange={(e) => setNewPlace(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Enter address"
                            data-testid="input-place-address"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Description
                          </label>
                          <Textarea
                            value={newPlace.description}
                            onChange={(e) => setNewPlace(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="What makes this place special?"
                            rows={3}
                            data-testid="textarea-place-description"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Amenities
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {amenities.map((amenity) => (
                              <Button
                                key={amenity}
                                variant={newPlace.amenities.includes(amenity) ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleAmenity(amenity)}
                                data-testid={`button-amenity-${amenity.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                {amenity}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleAddPlace}
                            disabled={createPlaceMutation.isPending}
                            className="flex-1 bg-primary hover:bg-primary/90"
                            data-testid="button-submit-place"
                          >
                            {createPlaceMutation.isPending ? "Adding..." : "Add Place"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowAddForm(false)}
                            data-testid="button-cancel-add-place"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map View */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="glass-effect h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>Interactive Map</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full p-6">
                <div className="h-full bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                  {/* Mock Map Interface */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/20 dark:to-green-900/20">
                    {/* Map markers simulation */}
                    <div className="absolute inset-0 p-8">
                      {filteredPlaces.slice(0, 8).map((place, index) => (
                        <motion.div
                          key={place.id}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className={`absolute w-8 h-8 ${getCategoryColor(place.category)} rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg hover:scale-110 transition-transform duration-200`}
                          style={{
                            left: `${20 + (index % 4) * 20}%`,
                            top: `${20 + Math.floor(index / 4) * 30}%`,
                          }}
                          onClick={() => setSelectedPlace(place)}
                          data-testid={`marker-${place.id}`}
                        >
                          {getCategoryIcon(place.category)}
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Map overlay info */}
                    <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/90 rounded-lg p-3 backdrop-blur-sm">
                      <p className="text-sm text-foreground">
                        📍 {filteredPlaces.length} places found
                      </p>
                      {userLocation && (
                        <p className="text-xs text-muted-foreground">
                          📱 Your location detected
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Center text for empty map */}
                  {filteredPlaces.length === 0 && (
                    <div className="text-center">
                      <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No places found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search or add the first place!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Places List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Nearby Places</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {filteredPlaces.map((place, index) => (
                      <motion.div
                        key={place.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`p-4 bg-background rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                          selectedPlace?.id === place.id ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedPlace(place)}
                        data-testid={`place-card-${place.id}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 ${getCategoryColor(place.category)} rounded-lg flex items-center justify-center text-white`}>
                            {getCategoryIcon(place.category)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-foreground">{place.name}</h3>
                              {place.verified && (
                                <Badge className="bg-green-100 text-green-700 text-xs">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {place.description}
                            </p>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < Math.floor(place.rating) 
                                        ? 'text-yellow-400 fill-current' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-xs text-muted-foreground ml-1">
                                  {place.rating} ({place.reviewCount})
                                </span>
                              </div>
                            </div>
                            {place.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {place.amenities.slice(0, 2).map((amenity) => (
                                  <Badge key={amenity} variant="outline" className="text-xs">
                                    {amenity}
                                  </Badge>
                                ))}
                                {place.amenities.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{place.amenities.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {filteredPlaces.length === 0 && (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No places found</h3>
                      <p className="text-muted-foreground text-sm">
                        Try a different search term or category filter.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Selected Place Details */}
            {selectedPlace && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{selectedPlace.name}</span>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => sharePlace(selectedPlace)}
                          data-testid="button-share-place"
                        >
                          <Share className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid="button-bookmark-place"
                        >
                          <Bookmark className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {selectedPlace.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{selectedPlace.address}</span>
                      </div>
                    </div>

                    {selectedPlace.amenities.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Amenities</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedPlace.amenities.map((amenity) => (
                            <Badge key={amenity} variant="secondary" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => openDirections(selectedPlace)}
                        className="flex-1 bg-primary hover:bg-primary/90"
                        data-testid="button-get-directions"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Directions
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        data-testid="button-call-place"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
