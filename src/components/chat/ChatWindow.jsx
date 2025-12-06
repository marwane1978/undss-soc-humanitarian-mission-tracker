import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Send, Loader2, ArrowLeft } from "lucide-react";
import MessageBubble from "./MessageBubble";
import { toast } from "sonner";

export default function ChatWindow({ conversation, currentUser, onBack }) {
  const [messageText, setMessageText] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", conversation.id],
    queryFn: async () => {
      const msgs = await base44.entities.ChatMessage.filter(
        { conversation_id: conversation.id },
        "created_date",
        200
      );
      setIsLoadingMessages(false);
      return msgs;
    },
    enabled: !!conversation.id,
    refetchInterval: 3000, // Refresh every 3 seconds for real-time
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      const message = await base44.entities.ChatMessage.create({
        conversation_id: conversation.id,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name,
        content,
        read_by: [currentUser.email],
      });

      // Update conversation's last message
      await base44.entities.ChatConversation.update(conversation.id, {
        last_message: content.substring(0, 100),
        last_message_at: new Date().toISOString(),
        last_message_by: currentUser.email,
      });

      // Send notifications to other participants
      const otherParticipants = conversation.participants.filter(
        p => p.user_email !== currentUser.email
      );
      
      for (const participant of otherParticipants) {
        try {
          await base44.entities.Notification.create({
            user_email: participant.user_email,
            type: "info",
            title: "Nouveau message",
            message: `${currentUser.full_name} vous a envoyé un message`,
            priority: "medium",
            is_read: false,
            link: `/Chat`,
          });
        } catch (error) {
          console.error("Error sending notification:", error);
        }
      }

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      setMessageText("");
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi du message");
    },
  });

  // Mark messages as read
  useEffect(() => {
    if (!messages.length) return;

    const unreadMessages = messages.filter(
      (msg) => msg.sender_email !== currentUser.email && !msg.read_by?.includes(currentUser.email)
    );

    if (unreadMessages.length > 0) {
      unreadMessages.forEach((msg) => {
        base44.entities.ChatMessage.update(msg.id, {
          read_by: [...(msg.read_by || []), currentUser.email],
        });
      });
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    }
  }, [messages, currentUser.email]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText.trim());
  };

  const getConversationName = () => {
    if (conversation.type === "group") return conversation.name || "Groupe";
    const other = conversation.participants.find(p => p.user_email !== currentUser.email);
    return other?.user_name || "Utilisateur";
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
          conversation.type === "group" ? "bg-purple-500" : "bg-blue-500"
        }`}>
          {conversation.type === "group" ? (
            <Users className="w-5 h-5" />
          ) : (
            <span className="text-sm font-semibold">
              {getConversationName().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{getConversationName()}</h3>
          {conversation.type === "group" && (
            <p className="text-xs text-slate-500">{conversation.participants.length} participants</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun message</p>
              <p className="text-xs">Envoyez le premier message</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_email === currentUser.email}
              showReadReceipts={conversation.type === "direct"}
            />
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Tapez votre message..."
            className="resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}