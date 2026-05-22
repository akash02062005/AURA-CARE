import {
  users,
  moodAssessments,
  chatConversations,
  counselors,
  bookings,
  forumPosts,
  forumReplies,
  dailyTasks,
  userStreaks,
  virtualPets,
  feedback,
  feelGoodPlaces,
  dailyContent,
  gameScores,
  type User,
  type UpsertUser,
  type MoodAssessment,
  type InsertMoodAssessment,
  type ChatConversation,
  type InsertChatConversation,
  type Counselor,
  type Booking,
  type InsertBooking,
  type ForumPost,
  type InsertForumPost,
  type ForumReply,
  type InsertForumReply,
  type DailyTask,
  type InsertDailyTask,
  type UserStreak,
  type VirtualPet,
  type Feedback,
  type InsertFeedback,
  type FeelGoodPlace,
  type InsertFeelGoodPlace,
  type DailyContent,
  type GameScore,
  type InsertGameScore,
} from "@shared/schema";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Mood assessments
  createMoodAssessment(assessment: InsertMoodAssessment): Promise<MoodAssessment>;
  getUserMoodAssessments(userId: string): Promise<MoodAssessment[]>;
  getLatestMoodAssessment(userId: string): Promise<MoodAssessment | undefined>;

  // Chat conversations
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  updateChatConversation(id: string, updates: Partial<ChatConversation>): Promise<ChatConversation>;
  getUserChatConversations(userId: string): Promise<ChatConversation[]>;

  // Counselors
  getAllCounselors(): Promise<Counselor[]>;
  getCounselor(id: string): Promise<Counselor | undefined>;

  // Bookings
  createBooking(booking: InsertBooking): Promise<Booking>;
  getUserBookings(userId: string): Promise<Booking[]>;
  getCounselorBookings(counselorId: string): Promise<Booking[]>;

  // Forum
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  getAllForumPosts(): Promise<ForumPost[]>;
  getForumPost(id: string): Promise<ForumPost | undefined>;
  createForumReply(reply: InsertForumReply): Promise<ForumReply>;
  getPostReplies(postId: string): Promise<ForumReply[]>;

  // Daily tasks
  createDailyTask(task: InsertDailyTask): Promise<DailyTask>;
  getUserDailyTasks(userId: string, date: Date): Promise<DailyTask[]>;
  updateDailyTask(id: string, updates: Partial<DailyTask>): Promise<DailyTask>;

  // User streaks
  getUserStreak(userId: string): Promise<UserStreak | undefined>;
  updateUserStreak(userId: string, updates: Partial<UserStreak>): Promise<UserStreak>;

  // Virtual pets
  getUserVirtualPet(userId: string): Promise<VirtualPet | undefined>;
  updateVirtualPet(userId: string, updates: Partial<VirtualPet>): Promise<VirtualPet>;

  // Feedback
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getUserFeedback(userId: string): Promise<Feedback[]>;
  getAllFeedback(): Promise<Feedback[]>;

  // Feel-good places
  createFeelGoodPlace(place: InsertFeelGoodPlace): Promise<FeelGoodPlace>;
  getFeelGoodPlaces(): Promise<FeelGoodPlace[]>;
  getNearbyPlaces(latitude: number, longitude: number, radius: number): Promise<FeelGoodPlace[]>;

  // Daily content
  getDailyContent(date: Date, type?: string): Promise<DailyContent[]>;

  // Game scores
  createGameScore(score: InsertGameScore): Promise<GameScore>;
  getUserGameScores(userId: string, gameType?: string): Promise<GameScore[]>;

  // Admin stats
  getAllUsers(): Promise<User[]>;
  getAllMoodAssessments(): Promise<MoodAssessment[]>;
  getAllChatConversations(): Promise<ChatConversation[]>;
  getAllBookings(): Promise<Booking[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private moodAssessments: Map<string, MoodAssessment> = new Map();
  private chatConversations: Map<string, ChatConversation> = new Map();
  private counselors: Map<string, Counselor> = new Map();
  private bookings: Map<string, Booking> = new Map();
  private forumPosts: Map<string, ForumPost> = new Map();
  private forumReplies: Map<string, ForumReply> = new Map();
  private dailyTasks: Map<string, DailyTask> = new Map();
  private userStreaks: Map<string, UserStreak> = new Map();
  private virtualPets: Map<string, VirtualPet> = new Map();
  private feedback: Map<string, Feedback> = new Map();
  private feelGoodPlaces: Map<string, FeelGoodPlace> = new Map();
  private dailyContent: Map<string, DailyContent> = new Map();
  private gameScores: Map<string, GameScore> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Initialize sample counselors
    const sampleCounselors: Counselor[] = [
      {
        id: "counselor-1",
        name: "Dr.Johnson",
        title: "Clinical Psychologist",
        specializations: ["anxiety", "depression", "academic stress"],
        experience: 8,
        rating: 4.9,
        reviewCount: 127,
        price: 1200,
        imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
        availability: {
          monday: ["09:00", "10:30", "14:00", "15:30", "17:00"],
          tuesday: ["09:00", "10:30", "14:00", "15:30"],
          wednesday: ["09:00", "10:30", "14:00", "15:30", "17:00"],
          thursday: ["09:00", "10:30", "14:00", "15:30"],
          friday: ["09:00", "10:30", "14:00", "15:30", "17:00"]
        },
        location: "Dindigal, India",
        sessionTypes: ["video", "phone", "in-person"],
        createdAt: new Date(),
      },
      {
        id: "counselor-2",
        name: "Dr. Rajesh ",
        title: "Counseling Psychologist",
        specializations: ["mindfulness", "CBT", "student counseling"],
        experience: 12,
        rating: 4.8,
        reviewCount: 89,
        price: 1000,
        imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
        availability: {
          monday: ["09:00", "10:30", "14:00", "15:30", "17:00"],
          tuesday: ["09:00", "10:30", "14:00", "15:30"],
          wednesday: ["09:00", "10:30", "14:00", "15:30", "17:00"],
          thursday: ["09:00", "10:30", "14:00", "15:30"],
          friday: ["09:00", "10:30", "14:00", "15:30", "17:00"]
        },
        location: "Dindigul, India",
        sessionTypes: ["video", "phone", "in-person"],
        createdAt: new Date(),
      },
      {
        id: "counselor-3",
        name: "Dr. Priya ",
        title: "Psychiatrist",
        specializations: ["mood disorders", "ADHD", "trauma therapy"],
        experience: 15,
        rating: 4.9,
        reviewCount: 203,
        price: 1500,
        imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
        availability: {
          tuesday: ["09:00", "10:30", "14:00", "15:30"],
          wednesday: ["09:00", "10:30", "14:00", "15:30", "17:00"],
          thursday: ["09:00", "10:30", "14:00", "15:30"],
          friday: ["09:00", "10:30", "14:00", "15:30", "17:00"]
        },
        location: "Dindigul, India",
        sessionTypes: ["video", "phone", "in-person"],
        createdAt: new Date(),
      }
    ];

    sampleCounselors.forEach(counselor => {
      this.counselors.set(counselor.id, counselor);
    });

    // Initialize sample daily content
    const today = new Date();
    const sampleContent: DailyContent[] = [
      {
        id: "quote-1",
        type: "quote",
        content: "The only way to make sense out of change is to plunge into it, move with it, and join the dance.",
        author: "Alan Watts",
        category: "mindfulness",
        difficulty: null,
        answer: null,
        language: "en",
        active: true,
        date: today,
        createdAt: new Date(),
      },
      {
        id: "riddle-1",
        type: "riddle",
        content: "I am not heavy, but I can make you feel weighed down. I am not visible, but I can cloud your vision. I am not permanent, but I can feel endless. What am I?",
        author: null,
        category: "mental health",
        difficulty: "medium",
        answer: "Stress or anxiety",
        language: "en",
        active: true,
        date: today,
        createdAt: new Date(),
      }
    ];

    sampleContent.forEach(content => {
      this.dailyContent.set(content.id, content);
    });

    // Initialize sample feel-good places
    const samplePlaces: FeelGoodPlace[] = [
      {
        id: "place-1",
        userId: "sample-user",
        name: "Central Park",
        description: "Beautiful green space perfect for meditation and relaxation",
        category: "park",
        latitude: 19.0760,
        longitude: 72.8777,
        address: "Mumbai, Maharashtra",
        rating: 4.5,
        reviewCount: 45,
        verified: true,
        imageUrl: null,
        amenities: ["walking trails", "benches", "gardens"],
        createdAt: new Date(),
      },
      {
        id: "place-2",
        userId: "sample-user",
        name: "Quiet Corner Cafe",
        description: "Peaceful cafe with calming music and comfortable seating",
        category: "cafe",
        latitude: 19.0726,
        longitude: 72.8826,
        address: "Bandra, Mumbai",
        rating: 4.3,
        reviewCount: 23,
        verified: true,
        imageUrl: null,
        amenities: ["wifi", "quiet zones", "healthy menu"],
        createdAt: new Date(),
      }
    ];

    samplePlaces.forEach(place => {
      this.feelGoodPlaces.set(place.id, place);
    });
  }

  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    const user: User = {
      ...userData,
      id: userData.id || randomUUID(),
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    } as User;
    
    this.users.set(user.id, user);
    
    // Initialize user streak and virtual pet if new user
    if (!existingUser) {
      const streak: UserStreak = {
        id: randomUUID(),
        userId: user.id,
        currentStreak: 0,
        longestStreak: 0,
        totalPoints: 0,
        badges: [],
        lastActiveDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.userStreaks.set(user.id, streak);

      const pet: VirtualPet = {
        id: randomUUID(),
        userId: user.id,
        name: "Subramani",
        type: "cat",
        happiness: 50,
        health: 100,
        lastFed: null,
        lastPlayed: null,
        level: 1,
        experience: 0,
        evolutionStage: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.virtualPets.set(user.id, pet);
    }
    
    return user;
  }

  // Mood assessments
  async createMoodAssessment(assessmentData: InsertMoodAssessment): Promise<MoodAssessment> {
    const assessment: MoodAssessment = {
      ...assessmentData,
      id: randomUUID(),
      createdAt: new Date(),
      recommendations: assessmentData.recommendations || null,
    };
    this.moodAssessments.set(assessment.id, assessment);
    return assessment;
  }

  async getUserMoodAssessments(userId: string): Promise<MoodAssessment[]> {
    return Array.from(this.moodAssessments.values())
      .filter(assessment => assessment.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getLatestMoodAssessment(userId: string): Promise<MoodAssessment | undefined> {
    const assessments = await this.getUserMoodAssessments(userId);
    return assessments[0];
  }

  // Chat conversations
  async createChatConversation(conversationData: InsertChatConversation): Promise<ChatConversation> {
    const conversation: ChatConversation = {
      ...conversationData,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      sentiment: conversationData.sentiment || null,
      escalated: conversationData.escalated || null,
    };
    this.chatConversations.set(conversation.id, conversation);
    return conversation;
  }

  async updateChatConversation(id: string, updates: Partial<ChatConversation>): Promise<ChatConversation> {
    const existing = this.chatConversations.get(id);
    if (!existing) throw new Error("Conversation not found");
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.chatConversations.set(id, updated);
    return updated;
  }

  async getUserChatConversations(userId: string): Promise<ChatConversation[]> {
    return Array.from(this.chatConversations.values())
      .filter(conversation => conversation.userId === userId)
      .sort((a, b) => b.updatedAt!.getTime() - a.updatedAt!.getTime());
  }

  // Counselors
  async getAllCounselors(): Promise<Counselor[]> {
    return Array.from(this.counselors.values());
  }

  async getCounselor(id: string): Promise<Counselor | undefined> {
    return this.counselors.get(id);
  }

  // Bookings
  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const booking: Booking = {
      ...bookingData,
      id: randomUUID(),
      createdAt: new Date(),
      status: bookingData.status || "scheduled",
      notes: bookingData.notes || null,
      reminderSent: bookingData.reminderSent || null,
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(booking => booking.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getCounselorBookings(counselorId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(booking => booking.counselorId === counselorId);
  }

  // Forum
  async createForumPost(postData: InsertForumPost): Promise<ForumPost> {
    const post: ForumPost = {
      ...postData,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      anonymous: postData.anonymous ?? null,
      upvotes: postData.upvotes ?? null,
      downvotes: postData.downvotes ?? null,
      flagged: postData.flagged ?? null,
    };
    this.forumPosts.set(post.id, post);
    return post;
  }

  async getAllForumPosts(): Promise<ForumPost[]> {
    return Array.from(this.forumPosts.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getForumPost(id: string): Promise<ForumPost | undefined> {
    return this.forumPosts.get(id);
  }

  async createForumReply(replyData: InsertForumReply): Promise<ForumReply> {
    const reply: ForumReply = {
      ...replyData,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      anonymous: replyData.anonymous ?? null,
      upvotes: replyData.upvotes ?? null,
      downvotes: replyData.downvotes ?? null,
      flagged: replyData.flagged ?? null,
    };
    this.forumReplies.set(reply.id, reply);
    return reply;
  }

  async getPostReplies(postId: string): Promise<ForumReply[]> {
    return Array.from(this.forumReplies.values())
      .filter(reply => reply.postId === postId)
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());
  }

  // Daily tasks
  async createDailyTask(taskData: InsertDailyTask): Promise<DailyTask> {
    const task: DailyTask = {
      ...taskData,
      id: randomUUID(),
      createdAt: new Date(),
      points: taskData.points ?? null,
      description: taskData.description ?? null,
      completed: taskData.completed ?? null,
      completedAt: taskData.completedAt ?? null,
    };
    this.dailyTasks.set(task.id, task);
    return task;
  }

  async getUserDailyTasks(userId: string, date: Date): Promise<DailyTask[]> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    return Array.from(this.dailyTasks.values())
      .filter(task => 
        task.userId === userId && 
        task.date >= startOfDay && 
        task.date < endOfDay
      );
  }

  async updateDailyTask(id: string, updates: Partial<DailyTask>): Promise<DailyTask> {
    const existing = this.dailyTasks.get(id);
    if (!existing) throw new Error("Task not found");
    
    const updated = { ...existing, ...updates };
    this.dailyTasks.set(id, updated);
    return updated;
  }

  // User streaks
  async getUserStreak(userId: string): Promise<UserStreak | undefined> {
    return this.userStreaks.get(userId);
  }

  async updateUserStreak(userId: string, updates: Partial<UserStreak>): Promise<UserStreak> {
    const existing = this.userStreaks.get(userId);
    if (!existing) {
      const newStreak: UserStreak = {
        id: randomUUID(),
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalPoints: 0,
        badges: [],
        lastActiveDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...updates,
      };
      this.userStreaks.set(userId, newStreak);
      return newStreak;
    }
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.userStreaks.set(userId, updated);
    return updated;
  }

  // Virtual pets
  async getUserVirtualPet(userId: string): Promise<VirtualPet | undefined> {
    return this.virtualPets.get(userId);
  }

  async updateVirtualPet(userId: string, updates: Partial<VirtualPet>): Promise<VirtualPet> {
    const existing = this.virtualPets.get(userId);
    if (!existing) {
      const newPet: VirtualPet = {
        id: randomUUID(),
        userId,
        name: "Luna",
        type: "cat",
        happiness: 50,
        health: 100,
        lastFed: null,
        lastPlayed: null,
        level: 1,
        experience: 0,
        evolutionStage: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...updates,
      };
      this.virtualPets.set(userId, newPet);
      return newPet;
    }
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.virtualPets.set(userId, updated);
    return updated;
  }

  // Feedback
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const feedbackItem: Feedback = {
      ...feedbackData,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      title: feedbackData.title ?? null,
      status: feedbackData.status ?? null,
      rating: feedbackData.rating ?? null,
      category: feedbackData.category ?? null,
      relatedId: feedbackData.relatedId ?? null,
      adminResponse: feedbackData.adminResponse ?? null,
    };
    this.feedback.set(feedbackItem.id, feedbackItem);
    return feedbackItem;
  }

  async getUserFeedback(userId: string): Promise<Feedback[]> {
    return Array.from(this.feedback.values())
      .filter(feedback => feedback.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getAllFeedback(): Promise<Feedback[]> {
    return Array.from(this.feedback.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  // Feel-good places
  async createFeelGoodPlace(placeData: InsertFeelGoodPlace): Promise<FeelGoodPlace> {
    const place: FeelGoodPlace = {
      ...placeData,
      id: randomUUID(),
      createdAt: new Date(),
      address: placeData.address ?? null,
      rating: placeData.rating ?? null,
      reviewCount: placeData.reviewCount ?? null,
      verified: placeData.verified ?? null,
      imageUrl: placeData.imageUrl ?? null,
      amenities: placeData.amenities ?? null,
      description: placeData.description ?? null,
    };
    this.feelGoodPlaces.set(place.id, place);
    return place;
  }

  async getFeelGoodPlaces(): Promise<FeelGoodPlace[]> {
    return Array.from(this.feelGoodPlaces.values());
  }

  async getNearbyPlaces(latitude: number, longitude: number, radius: number): Promise<FeelGoodPlace[]> {
    // Simple distance calculation for in-memory storage
    return Array.from(this.feelGoodPlaces.values()).filter(place => {
      const distance = Math.sqrt(
        Math.pow(place.latitude - latitude, 2) + 
        Math.pow(place.longitude - longitude, 2)
      );
      return distance <= radius;
    });
  }

  // Daily content
  async getDailyContent(date: Date, type?: string): Promise<DailyContent[]> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    return Array.from(this.dailyContent.values())
      .filter(content => 
        content.active &&
        content.date >= startOfDay && 
        content.date < endOfDay &&
        (!type || content.type === type)
      );
  }

  // Game scores
  async createGameScore(scoreData: InsertGameScore): Promise<GameScore> {
    const score: GameScore = {
      ...scoreData,
      id: randomUUID(),
      createdAt: new Date(),
      difficulty: scoreData.difficulty ?? null,
      duration: scoreData.duration ?? null,
      mood: scoreData.mood ?? null,
    };
    this.gameScores.set(score.id, score);
    return score;
  }

  async getUserGameScores(userId: string, gameType?: string): Promise<GameScore[]> {
    return Array.from(this.gameScores.values())
      .filter(score => 
        score.userId === userId &&
        (!gameType || score.gameType === gameType)
      )
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  // Admin stats methods
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllMoodAssessments(): Promise<MoodAssessment[]> {
    return Array.from(this.moodAssessments.values());
  }

  async getAllChatConversations(): Promise<ChatConversation[]> {
    return Array.from(this.chatConversations.values());
  }

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }
}

export const storage = new MemStorage();
