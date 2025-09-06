import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import EmojiPicker from "./EmojiPicker";
import backend from "~backend/client";

export default function GuestbookSection() {
  const [formData, setFormData] = useState({
    nickname: "",
    message: "",
    emoji: "👋"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const entriesQuery = useQuery({
    queryKey: ["guestbook"],
    queryFn: async () => {
      return await backend.guestbook.list({ approved: true });
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await backend.guestbook.create(data);
    },
    onSuccess: () => {
      toast({
        title: "Message Submitted!",
        description: "Your message has been submitted for moderation.",
      });
      setFormData({ nickname: "", message: "", emoji: "👋" });
      queryClient.invalidateQueries({ queryKey: ["guestbook"] });
    },
    onError: (error: any) => {
      console.error("Failed to create guest entry:", error);
      toast({
        title: "Failed to Submit Message",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message before submitting.",
        variant: "destructive",
      });
      return;
    }
    createEntryMutation.mutate(formData);
  };

  const entries = entriesQuery.data?.entries || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Guestbook
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                placeholder="Your nickname (optional)"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              />
            </div>
            <div>
              <EmojiPicker
                value={formData.emoji}
                onChange={(emoji) => setFormData({ ...formData, emoji })}
              />
            </div>
          </div>
          <Textarea
            placeholder="Leave a message..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={3}
            required
          />
          <Button 
            type="submit" 
            className="w-full flex items-center gap-2"
            disabled={createEntryMutation.isPending}
          >
            <Send className="h-4 w-4" />
            {createEntryMutation.isPending ? "Submitting..." : "Sign Guestbook"}
          </Button>
        </form>

        <div className="space-y-4">
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No messages yet. Be the first to sign the guestbook!
            </p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{entry.emoji}</span>
                    <span className="font-medium text-foreground">
                      {entry.nickname || "Anonymous"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!entry.isApproved && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-foreground">{entry.message}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
