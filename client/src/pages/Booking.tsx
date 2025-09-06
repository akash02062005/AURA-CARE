import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertBookingSchema } from "@shared/schema";
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Star, 
  Clock, 
  Video, 
  Phone, 
  User,
  CheckCircle,
  Filter,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

interface Counselor {
  id: string;
  name: string;
  title: string;
  specializations: string[];
  experience: number;
  rating: number;
  reviewCount: number;
  price: number;
  imageUrl?: string;
  location: string;
  sessionTypes: string[];
  availability: any;
}

type SessionType = "video" | "phone" | "in-person";

export default function Booking() {
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [sessionType, setSessionType] = useState<SessionType>("video");
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("");
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: counselors } = useQuery({
    queryKey: ["/api/counselors"],
  });

  const { data: bookings } = useQuery({
    queryKey: ["/api/bookings"],
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertBookingSchema>) => {
      const response = await apiRequest("POST", "/api/bookings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setShowBookingForm(false);
      setSelectedCounselor(null);
      setSelectedDate("");
      setSelectedTime("");
      setNotes("");
      
      toast({
        title: "Booking Confirmed",
        description: "Your counseling session has been booked successfully. You'll receive a confirmation email shortly.",
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
        title: "Booking Failed",
        description: "Failed to book the session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBooking = () => {
    if (!selectedCounselor || !selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a counselor, date, and time.",
        variant: "destructive",
      });
      return;
    }

    const bookingData = {
      counselorId: selectedCounselor.id,
      date: new Date(`${selectedDate}T${selectedTime}`),
      sessionType,
      notes: notes || undefined,
    };

    createBookingMutation.mutate(bookingData);
  };

  const getAvailableTimeSlots = (date: string) => {
    // Mock available time slots - in real app, this would check counselor availability
    const timeSlots = [
      "09:00", "10:30", "14:00", "15:30", "17:00"
    ];
    
    // Filter out booked slots (mock logic)
    return timeSlots;
  };

  const filteredCounselors = counselors?.filter((counselor: Counselor) => {
    const matchesSearch = counselor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         counselor.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSpecialization = !specializationFilter || 
                                 counselor.specializations.includes(specializationFilter);
    return matchesSearch && matchesSpecialization;
  }) || [];

  const allSpecializations = Array.from(
    new Set(counselors?.flatMap((c: Counselor) => c.specializations) || [])
  );

  const generateCalendarDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  if (showBookingForm && selectedCounselor) {
    return (
      <div className="min-h-screen p-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-effect shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Complete Your Booking</CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => setShowBookingForm(false)}
                    data-testid="button-back-to-counselors"
                  >
                    Back to Counselors
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Selected Counselor Summary */}
                <div className="flex items-center space-x-4 p-4 bg-background rounded-xl border">
                  {selectedCounselor.imageUrl ? (
                    <img 
                      src={selectedCounselor.imageUrl} 
                      alt={selectedCounselor.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{selectedCounselor.name}</h3>
                    <p className="text-muted-foreground">{selectedCounselor.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.floor(selectedCounselor.rating) ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {selectedCounselor.rating} ({selectedCounselor.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-2xl font-bold text-primary">₹{selectedCounselor.price}</p>
                    <p className="text-sm text-muted-foreground">per session</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Date & Time Selection */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-foreground mb-4">Select Date</h3>
                      <div className="grid grid-cols-7 gap-2 text-center text-sm mb-4">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                          <div key={day} className="p-2 text-muted-foreground font-medium">{day}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {generateCalendarDates().slice(0, 21).map((date, index) => {
                          const dateStr = formatDate(date);
                          const isSelected = selectedDate === dateStr;
                          const isDisabled = index === 0; // Disable today for demo
                          
                          return (
                            <Button
                              key={dateStr}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              disabled={isDisabled}
                              onClick={() => {
                                setSelectedDate(dateStr);
                                setSelectedTime("");
                              }}
                              className={`h-12 ${isSelected ? 'bg-primary text-white' : ''}`}
                              data-testid={`button-date-${dateStr}`}
                            >
                              {date.getDate()}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {selectedDate && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="font-semibold text-foreground mb-4">Available Times</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {getAvailableTimeSlots(selectedDate).map(time => (
                            <Button
                              key={time}
                              variant={selectedTime === time ? "default" : "outline"}
                              onClick={() => setSelectedTime(time)}
                              className={selectedTime === time ? "bg-primary text-white" : ""}
                              data-testid={`button-time-${time}`}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Session Details */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-foreground mb-4">Session Type</h3>
                      <div className="space-y-3">
                        {selectedCounselor.sessionTypes.map((type) => {
                          const isSelected = sessionType === type;
                          return (
                            <label
                              key={type}
                              className={`flex items-center p-4 bg-background border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                isSelected ? 'border-primary' : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="session-type"
                                value={type}
                                checked={isSelected}
                                onChange={() => setSessionType(type as SessionType)}
                                className="mr-3 text-primary"
                                data-testid={`radio-session-${type}`}
                              />
                              <div className="flex items-center space-x-3">
                                {type === "video" && <Video className="w-5 h-5 text-primary" />}
                                {type === "phone" && <Phone className="w-5 h-5 text-primary" />}
                                {type === "in-person" && <MapPin className="w-5 h-5 text-primary" />}
                                <div>
                                  <span className="font-medium text-foreground capitalize">{type.replace('-', ' ')}</span>
                                  <p className="text-sm text-muted-foreground">
                                    {type === "video" && "Secure video session"}
                                    {type === "phone" && "Voice-only session"}
                                    {type === "in-person" && "Face-to-face meeting"}
                                  </p>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Additional Notes (Optional)
                      </label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any specific topics you'd like to discuss or concerns you have..."
                        rows={4}
                        data-testid="textarea-notes"
                      />
                    </div>
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="bg-background rounded-xl p-6 border">
                  <h3 className="font-semibold text-foreground mb-4">Booking Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Counselor:</span>
                      <span className="text-foreground font-medium">{selectedCounselor.name}</span>
                    </div>
                    {selectedDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="text-foreground font-medium">
                          {new Date(selectedDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedTime && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="text-foreground font-medium">{selectedTime}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Session Type:</span>
                      <span className="text-foreground font-medium capitalize">
                        {sessionType.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between font-semibold text-lg">
                      <span className="text-foreground">Total:</span>
                      <span className="text-primary">₹{selectedCounselor.price}</span>
                    </div>
                  </div>
                </div>

                {/* Confirm Booking Button */}
                <Button
                  onClick={handleBooking}
                  disabled={!selectedDate || !selectedTime || createBookingMutation.isPending}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white h-12 text-lg font-semibold"
                  data-testid="button-confirm-booking"
                >
                  {createBookingMutation.isPending ? "Booking..." : "Confirm Booking"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">Book a Counseling Session</h1>
          <p className="text-muted-foreground text-lg">
            Connect with licensed mental health professionals who can support your journey
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
                    placeholder="Search by name or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-counselors"
                  />
                </div>
                <div className="flex space-x-2">
                  <select
                    value={specializationFilter}
                    onChange={(e) => setSpecializationFilter(e.target.value)}
                    className="px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                    data-testid="select-specialization"
                  >
                    <option value="">All Specializations</option>
                    {allSpecializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Counselor List */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {filteredCounselors.length === 0 ? (
                <Card className="glass-effect">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No counselors found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search criteria or filters.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <AnimatePresence>
                  {filteredCounselors.map((counselor: Counselor, index: number) => (
                    <motion.div
                      key={counselor.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className={`glass-effect card-3d cursor-pointer transition-all duration-200 ${
                        selectedCounselor?.id === counselor.id ? 'border-primary shadow-lg' : 'hover:shadow-md'
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            {counselor.imageUrl ? (
                              <img 
                                src={counselor.imageUrl} 
                                alt={counselor.name}
                                className="w-20 h-20 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                                <User className="w-10 h-10 text-primary" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground text-lg">{counselor.name}</h3>
                              <p className="text-muted-foreground">{counselor.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {counselor.experience} years experience
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {counselor.specializations.slice(0, 3).map(spec => (
                                  <Badge key={spec} variant="secondary" className="text-xs">
                                    {spec}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center space-x-4 mt-2">
                                <div className="flex items-center space-x-1">
                                  <div className="flex text-yellow-400">
                                    {Array.from({ length: 5 }, (_, i) => (
                                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(counselor.rating) ? 'fill-current' : ''}`} />
                                    ))}
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {counselor.rating} ({counselor.reviewCount} reviews)
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {counselor.location}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">₹{counselor.price}</p>
                              <p className="text-sm text-muted-foreground">per session</p>
                              <div className="flex items-center justify-end text-secondary text-sm mt-1">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                <span>Available today</span>
                              </div>
                              <Button
                                onClick={() => {
                                  setSelectedCounselor(counselor);
                                  setShowBookingForm(true);
                                }}
                                className="mt-3 bg-primary hover:bg-primary/90"
                                data-testid={`button-book-${counselor.id}`}
                              >
                                Book Session
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Map Placeholder */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>Nearby Locations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Interactive map</p>
                    <p className="text-muted-foreground text-xs">
                      📍 {filteredCounselors.length} counselors nearby
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            {bookings && bookings.length > 0 && (
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span>Recent Bookings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookings.slice(0, 3).map((booking: any) => (
                      <div key={booking.id} className="p-3 bg-background rounded-lg border">
                        <p className="font-medium text-foreground text-sm">
                          {new Date(booking.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.sessionType} • {booking.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help & Support */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Having trouble booking a session? Our support team is here to help.
                </p>
                <Button variant="outline" className="w-full" data-testid="button-contact-support">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
