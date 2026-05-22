import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Bot,
  User,
  Send,
  Mic,
  Volume2,
  Languages,
  Circle,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatResponse {
  conversation: any;
  response: string;
  sentiment: string;
  escalated: boolean;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false); // 🔥 Added
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: conversations } = useQuery({
    queryKey: ["/api/chat/conversations"],
  });

  // 🔊 Play AI voice
  async function playVoice(text: string) {
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (err) {
      console.error("TTS error:", err);
    }
  }

  // 🎤 Start listening (STT)
  function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCurrentMessage(transcript);
      handleSendMessage(transcript);
    };

    recognition.start();
  }

  const chatMutation = useMutation({
    mutationFn: async (message: string): Promise<ChatResponse> => {
      const response = await apiRequest("POST", "/api/chat", {
        message,
        conversationId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
      }]);
      setConversationId(data.conversation.id);
      setIsTyping(false);

      // 🔊 Auto play AI voice
      playVoice(data.response); // 🔥 Added

      if (data.escalated) {
        toast({
          title: "Support Recommendation",
          description: "Based on your message, we recommend speaking with a counselor. Would you like to book a session?",
          variant: "default",
          action: (
            <Button
              size="sm"
              onClick={() => window.location.href = "/booking"}
              className="ml-2"
            >
              Book Session
            </Button>
          ),
        });
      }
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
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsTyping(false);
    },
  });

  const handleSendMessage = (msg?: string) => {
    const text = msg || currentMessage;
    if (!text.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    chatMutation.mutate(text);
    setCurrentMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Hello! I'm here to support you on your mental wellness journey. How are you feeling today?",
        timestamp: new Date().toISOString(),
      }]);
    }
  }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto max-w-4xl">
        <Card className="glass-effect h-[calc(100vh-8rem)] flex flex-col">
          {/* Chat Header */}
          <CardHeader className="border-b border-border">
            <div className="flex items-center space-x-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg"
              >
                <Bot className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <CardTitle className="text-xl">Aura AI Assistant</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your 24/7 mental health support companion
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-auto">
                <Circle className="w-2 h-2 text-green-500 fill-current animate-pulse" />
                <span className="text-sm text-green-500">Online</span>
              </div>
            </div>
          </CardHeader>

          {/* Chat Messages */}
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex space-x-3 ${
                    message.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-md p-4 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-white ml-auto"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-2 opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex space-x-3"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex space-x-1">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-primary rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-primary rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-primary rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Chat Input */}
          <div className="p-6 border-t border-border">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="pr-12 h-12"
                  disabled={chatMutation.isPending}
                  data-testid="input-chat-message"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${isListening ? "text-red-500" : ""}`} // 🔥 Added visual indicator
                  onClick={startListening} // 🔥 Hook up mic
                  data-testid="button-voice-input"
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
              <Button
                onClick={() => handleSendMessage()}
                disabled={!currentMessage.trim() || chatMutation.isPending}
                className="h-12 px-6"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <Button variant="ghost" size="sm" data-testid="button-language">
                <Languages className="w-4 h-4 mr-1" />
                Hindi
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const lastBotMessage = [...messages].reverse().find(m => m.role === "assistant");
                  if (lastBotMessage) playVoice(lastBotMessage.content);
                }}
                data-testid="button-read-aloud"
              >
                <Volume2 className="w-4 h-4 mr-1" />
                Read aloud
              </Button>
              {conversations && Array.isArray(conversations) && conversations.some((c: any) => c.escalated) && (
                <Badge variant="destructive" className="ml-auto">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Crisis detected - Consider booking a session
                </Badge>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
