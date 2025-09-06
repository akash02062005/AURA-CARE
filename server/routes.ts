import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertMoodAssessmentSchema,
  insertChatConversationSchema,
  insertBookingSchema,
  insertForumPostSchema,
  insertForumReplySchema,
  insertDailyTaskSchema,
  insertFeedbackSchema,
  insertFeelGoodPlaceSchema,
  insertGameScoreSchema,
} from "@shared/schema";
import OpenAI from "openai";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Mood Assessment Routes
  app.post('/api/mood-assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertMoodAssessmentSchema.parse({ ...req.body, userId });
      const assessment = await storage.createMoodAssessment(data);
      res.json(assessment);
    } catch (error) {
      console.error("Error creating mood assessment:", error);
      res.status(500).json({ message: "Failed to create mood assessment" });
    }
  });

  app.get('/api/mood-assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assessments = await storage.getUserMoodAssessments(userId);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching mood assessments:", error);
      res.status(500).json({ message: "Failed to fetch mood assessments" });
    }
  });

  app.get('/api/mood-assessments/latest', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assessment = await storage.getLatestMoodAssessment(userId);
      res.json(assessment);
    } catch (error) {
      console.error("Error fetching latest mood assessment:", error);
      res.status(500).json({ message: "Failed to fetch latest mood assessment" });
    }
  });

  // Chat/AI Routes
  app.post('/api/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, conversationId } = req.body;

      // Get or create conversation
      let conversation;
      if (conversationId) {
        const conversations = await storage.getUserChatConversations(userId);
        conversation = conversations.find(c => c.id === conversationId);
      }

      if (!conversation) {
        conversation = await storage.createChatConversation({
          userId,
          messages: [],
          sentiment: "neutral",
          escalated: false,
        });
      }

      // Add user message
      const messages = [...(conversation.messages as any[]), {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      }];

      // Get AI response
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are Aura AI, a compassionate mental health support assistant. Provide helpful, empathetic responses focused on coping strategies, mindfulness techniques, and emotional support. If the user expresses severe distress or mentions self-harm, gently suggest they speak with a counselor and provide crisis resources."
          },
          {
            role: "user",
            content: message
          }
        ],
      });

      const aiMessage = {
        role: "assistant",
        content: aiResponse.choices[0].message.content,
        timestamp: new Date().toISOString(),
      };

      // Analyze sentiment
      const sentimentResponse = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "Analyze the sentiment of this message and determine if it indicates a mental health crisis. Respond with JSON in this format: { 'sentiment': 'positive'|'neutral'|'negative'|'crisis', 'confidence': number }"
          },
          {
            role: "user",
            content: message
          }
        ],
        response_format: { type: "json_object" },
      });

      const sentimentData = JSON.parse(sentimentResponse.choices[0].message.content || '{"sentiment": "neutral", "confidence": 0.5}');

      // Update conversation
      const updatedMessages = [...messages, aiMessage];
      conversation = await storage.updateChatConversation(conversation.id, {
        messages: updatedMessages,
        sentiment: sentimentData.sentiment,
        escalated: sentimentData.sentiment === "crisis",
      });

      res.json({
        conversation,
        response: aiMessage.content,
        sentiment: sentimentData.sentiment,
        escalated: sentimentData.sentiment === "crisis",
      });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get('/api/chat/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getUserChatConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Counselor Routes
  app.get('/api/counselors', async (req, res) => {
    try {
      const counselors = await storage.getAllCounselors();
      res.json(counselors);
    } catch (error) {
      console.error("Error fetching counselors:", error);
      res.status(500).json({ message: "Failed to fetch counselors" });
    }
  });

  app.get('/api/counselors/:id', async (req, res) => {
    try {
      const counselor = await storage.getCounselor(req.params.id);
      if (!counselor) {
        return res.status(404).json({ message: "Counselor not found" });
      }
      res.json(counselor);
    } catch (error) {
      console.error("Error fetching counselor:", error);
      res.status(500).json({ message: "Failed to fetch counselor" });
    }
  });

  // Booking Routes
  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertBookingSchema.parse({ ...req.body, userId });
      const booking = await storage.createBooking(data);
      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Forum Routes
  app.post('/api/forum/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertForumPostSchema.parse({ ...req.body, userId });
      const post = await storage.createForumPost(data);
      res.json(post);
    } catch (error) {
      console.error("Error creating forum post:", error);
      res.status(500).json({ message: "Failed to create forum post" });
    }
  });

  app.get('/api/forum/posts', async (req, res) => {
    try {
      const posts = await storage.getAllForumPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching forum posts:", error);
      res.status(500).json({ message: "Failed to fetch forum posts" });
    }
  });

  app.post('/api/forum/posts/:postId/replies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      const data = insertForumReplySchema.parse({ ...req.body, userId, postId });
      const reply = await storage.createForumReply(data);
      res.json(reply);
    } catch (error) {
      console.error("Error creating forum reply:", error);
      res.status(500).json({ message: "Failed to create forum reply" });
    }
  });

  app.get('/api/forum/posts/:postId/replies', async (req, res) => {
    try {
      const replies = await storage.getPostReplies(req.params.postId);
      res.json(replies);
    } catch (error) {
      console.error("Error fetching forum replies:", error);
      res.status(500).json({ message: "Failed to fetch forum replies" });
    }
  });

  // Daily Tasks Routes
  app.post('/api/daily-tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertDailyTaskSchema.parse({ ...req.body, userId });
      const task = await storage.createDailyTask(data);
      res.json(task);
    } catch (error) {
      console.error("Error creating daily task:", error);
      res.status(500).json({ message: "Failed to create daily task" });
    }
  });

  app.get('/api/daily-tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const tasks = await storage.getUserDailyTasks(userId, date);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching daily tasks:", error);
      res.status(500).json({ message: "Failed to fetch daily tasks" });
    }
  });

  app.patch('/api/daily-tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const task = await storage.updateDailyTask(req.params.id, req.body);
      res.json(task);
    } catch (error) {
      console.error("Error updating daily task:", error);
      res.status(500).json({ message: "Failed to update daily task" });
    }
  });

  // User Streak Routes
  app.get('/api/user/streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const streak = await storage.getUserStreak(userId);
      res.json(streak);
    } catch (error) {
      console.error("Error fetching user streak:", error);
      res.status(500).json({ message: "Failed to fetch user streak" });
    }
  });

  app.patch('/api/user/streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const streak = await storage.updateUserStreak(userId, req.body);
      res.json(streak);
    } catch (error) {
      console.error("Error updating user streak:", error);
      res.status(500).json({ message: "Failed to update user streak" });
    }
  });

  // Virtual Pet Routes
  app.get('/api/virtual-pet', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pet = await storage.getUserVirtualPet(userId);
      res.json(pet);
    } catch (error) {
      console.error("Error fetching virtual pet:", error);
      res.status(500).json({ message: "Failed to fetch virtual pet" });
    }
  });

  app.patch('/api/virtual-pet', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pet = await storage.updateVirtualPet(userId, req.body);
      res.json(pet);
    } catch (error) {
      console.error("Error updating virtual pet:", error);
      res.status(500).json({ message: "Failed to update virtual pet" });
    }
  });

  // Feedback Routes
  app.post('/api/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertFeedbackSchema.parse({ ...req.body, userId });
      const feedback = await storage.createFeedback(data);
      res.json(feedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  app.get('/api/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const feedback = await storage.getUserFeedback(userId);
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // Feel-Good Places Routes
  app.post('/api/places', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertFeelGoodPlaceSchema.parse({ ...req.body, userId });
      const place = await storage.createFeelGoodPlace(data);
      res.json(place);
    } catch (error) {
      console.error("Error creating place:", error);
      res.status(500).json({ message: "Failed to create place" });
    }
  });

  app.get('/api/places', async (req, res) => {
    try {
      const { lat, lng, radius } = req.query;
      let places;
      
      if (lat && lng && radius) {
        places = await storage.getNearbyPlaces(
          parseFloat(lat as string),
          parseFloat(lng as string),
          parseFloat(radius as string)
        );
      } else {
        places = await storage.getFeelGoodPlaces();
      }
      
      res.json(places);
    } catch (error) {
      console.error("Error fetching places:", error);
      res.status(500).json({ message: "Failed to fetch places" });
    }
  });

  // Daily Content Routes
  app.get('/api/daily-content', async (req, res) => {
    try {
      const { date, type } = req.query;
      const contentDate = date ? new Date(date as string) : new Date();
      const content = await storage.getDailyContent(contentDate, type as string);
      res.json(content);
    } catch (error) {
      console.error("Error fetching daily content:", error);
      res.status(500).json({ message: "Failed to fetch daily content" });
    }
  });

  // Game Scores Routes
  app.post('/api/game-scores', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertGameScoreSchema.parse({ ...req.body, userId });
      const score = await storage.createGameScore(data);
      res.json(score);
    } catch (error) {
      console.error("Error creating game score:", error);
      res.status(500).json({ message: "Failed to create game score" });
    }
  });

  app.get('/api/game-scores', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { gameType } = req.query;
      const scores = await storage.getUserGameScores(userId, gameType as string);
      res.json(scores);
    } catch (error) {
      console.error("Error fetching game scores:", error);
      res.status(500).json({ message: "Failed to fetch game scores" });
    }
  });

  // Admin Routes (for admin dashboard)
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      // Simple analytics - in production, this would be more sophisticated
      const allUsers = await storage.getAllUsers();
      const allAssessments = await storage.getAllMoodAssessments();
      const allConversations = await storage.getAllChatConversations();
      const allBookings = await storage.getAllBookings();
      
      const stats = {
        totalUsers: allUsers.length,
        totalAssessments: allAssessments.length,
        totalConversations: allConversations.length,
        totalBookings: allBookings.length,
        averageMoodScore: allAssessments.length > 0 
          ? allAssessments.reduce((sum, a) => sum + a.totalScore, 0) / allAssessments.length 
          : 0,
        crisisEscalations: allConversations.filter(c => c.escalated).length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time forum features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Broadcast to all connected clients (simple implementation)
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
