import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Search, Users, User, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ConversationList({ 
  conversations, 
  currentUser, 
  selectedConversation, 
  onSelectConversation,
  unreadCounts,
  onNewConversation 
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const getConversationName = (conv) => {
    if (conv.type === "group") return conv.name || "Groupe sans nom";
    
    const otherParticipant = conv.participants.find(p => p.user_email !== currentUser?.email);
    return otherParticipant?.user_name || "Utilisateur inconnu";
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredConversations = conversations.filter(conv => {
    const name = getConversationName(conv);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-full flex flex-col bg-white border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button size="icon" variant="ghost" onClick={onNewConversation}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune conversation</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const name = getConversationName(conv);
            const unreadCount = unreadCounts[conv.id] || 0;
            const isSelected = selectedConversation?.id === conv.id;

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b ${
                  isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                  conv.type === "group" ? "bg-purple-500" : "bg-blue-500"
                }`}>
                  {conv.type === "group" ? (
                    <Users className="w-6 h-6" />
                  ) : (
                    <span className="text-sm">{getInitials(name)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-slate-900 truncate">{name}</p>
                    {conv.last_message_at && (
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {format(new Date(conv.last_message_at), "HH:mm", { locale: fr })}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className="text-sm text-slate-500 truncate">
                      {conv.last_message_by === currentUser?.email ? "Vous: " : ""}
                      {conv.last_message}
                    </p>
                  )}
                  {conv.type === "group" && (
                    <p className="text-xs text-slate-400 mt-1">
                      {conv.participants.length} participant(s)
                    </p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}