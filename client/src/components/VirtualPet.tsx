import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Gamepad2, Cookie } from "lucide-react";
import { motion } from "framer-motion";

export default function VirtualPet() {
  const queryClient = useQueryClient();
  const [petAnimation, setPetAnimation] = useState("idle");

  const { data: pet } = useQuery({
    queryKey: ["/api/virtual-pet"],
  });

  const feedPetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/virtual-pet", {
        happiness: Math.min(100, (pet && typeof pet === 'object' && pet !== null && 'happiness' in pet ? (pet.happiness as number) : 0) + 20),
        health: Math.min(100, (pet && typeof pet === 'object' && pet !== null && 'health' in pet ? (pet.health as number) : 0) + 10),
        lastFed: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-pet"] });
      setPetAnimation("eating");
      setTimeout(() => setPetAnimation("idle"), 2000);
    },
  });

  const playWithPetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/virtual-pet", {
        happiness: Math.min(100, (pet && typeof pet === 'object' && pet !== null && 'happiness' in pet ? (pet.happiness as number) : 0) + 30),
        experience: (pet && typeof pet === 'object' && pet !== null && 'experience' in pet ? (pet.experience as number) : 0) + 10,
        lastPlayed: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-pet"] });
      setPetAnimation("playing");
      setTimeout(() => setPetAnimation("idle"), 2000);
    },
  });

  const getPetEmoji = () => {
    if (!pet) return "🐱";
    
    if (!pet || typeof pet !== 'object' || pet === null || !('happiness' in pet) || !('type' in pet)) return "🐱";
    const happiness = pet.happiness as number;
    const type = pet.type as string;
    
    if (happiness >= 80) {
      return type === "cat" ? "😸" : "🐶";
    } else if (happiness >= 50) {
      return type === "cat" ? "🐱" : "🐕";
    } else {
      return type === "cat" ? "😿" : "😞";
    }
  };

  const getHappinessColor = (happiness: number) => {
    if (happiness >= 80) return "bg-green-500";
    if (happiness >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (!pet) return null;

  return (
    <Card className="glass-effect">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Heart className="w-5 h-5 text-red-500" />
          <span>Your Companion</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <motion.div
          className="text-6xl"
          animate={{
            scale: petAnimation === "playing" ? [1, 1.2, 1] : petAnimation === "eating" ? [1, 1.1, 1] : 1,
            rotate: petAnimation === "playing" ? [0, 10, -10, 0] : 0,
          }}
          transition={{ duration: 0.5, repeat: petAnimation === "playing" ? 2 : 0 }}
        >
          {getPetEmoji()}
        </motion.div>

        <div>
          <h4 className="font-semibold text-foreground mb-2">{pet && typeof pet === 'object' && pet !== null && 'name' in pet ? (pet.name as string) : 'Luna'}</h4>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Happiness</span>
                <span>{pet && typeof pet === 'object' && pet !== null && 'happiness' in pet ? (pet.happiness as number) : 0}%</span>
              </div>
              <Progress 
                value={pet && typeof pet === 'object' && pet !== null && 'happiness' in pet ? (pet.happiness as number) : 0} 
                className={`h-2 ${getHappinessColor(pet && typeof pet === 'object' && pet !== null && 'happiness' in pet ? (pet.happiness as number) : 0)}`}
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Health</span>
                <span>{pet && typeof pet === 'object' && pet !== null && 'health' in pet ? (pet.health as number) : 0}%</span>
              </div>
              <Progress value={pet && typeof pet === 'object' && pet !== null && 'health' in pet ? (pet.health as number) : 0} className="h-2 bg-blue-500" />
            </div>
            <div className="text-sm text-muted-foreground">
              Level {pet && typeof pet === 'object' && pet !== null && 'level' in pet ? (pet.level as number) : 1} • {pet && typeof pet === 'object' && pet !== null && 'experience' in pet ? (pet.experience as number) : 0} XP
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={() => feedPetMutation.mutate()}
            disabled={feedPetMutation.isPending}
            className="flex-1"
            data-testid="button-feed-pet"
          >
            <Cookie className="w-4 h-4 mr-1" />
            Feed
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => playWithPetMutation.mutate()}
            disabled={playWithPetMutation.isPending}
            className="flex-1"
            data-testid="button-play-pet"
          >
            <Gamepad2 className="w-4 h-4 mr-1" />
            Play
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
