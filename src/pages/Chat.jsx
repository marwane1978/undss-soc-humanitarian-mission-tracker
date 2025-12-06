import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Users, User } from "lucide-react";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import { toast } from "sonner";

export default function Chat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [newConvType, setNewConvType] = useState("direct");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedGroupUsers, setSelectedGroupUsers] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: conversations = [] } = useQuery({
    queryKey: ["chat-conversations", currentUser?.email],
    queryFn: async () => {
      const allConvs = await base44.entities.ChatConversation.list("-last_message_at", 100);
      return allConvs.filter(conv =>
        conv.participants.some(p => p.user_email === currentUser?.email)
      );
    },
    enabled: !!currentUser?.email,
    refetchInterval: 5000,
  });

  const { data: allUserProfiles = [] } = useQuery({
    queryKey: ["user-profiles"],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  // Map user profiles to user-like objects
  const allUsers = allUserProfiles.map(profile => ({
    id: profile.id,
    email: profile.user_email,
    full_name: profile.user_full_name,
  }));

  const { data: allMessages = [] } = useQuery({
    queryKey: ["all-chat-messages"],
    queryFn: () => base44.entities.ChatMessage.list("-created_date", 500),
    refetchInterval: 5000,
  });

  const createConversationMutation = useMutation({
    mutationFn: async (convData) => {
      const existing = conversations.find(conv =>
        conv.type === "direct" &&
        conv.participants.length === 2 &&
        conv.participants.some(p => p.user_email === convData.participants[0].user_email) &&
        conv.participants.some(p => p.user_email === convData.participants[1].user_email)
      );

      if (existing) return existing;

      return await base44.entities.ChatConversation.create(convData);
    },
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      setSelectedConversation(conv);
      setShowNewConversationDialog(false);
      setSelectedUserId("");
      setGroupName("");
      setSelectedGroupUsers([]);
    },
    onError: () => {
      toast.error("Erreur lors de la création de la conversation");
    },
  });

  const handleCreateConversation = () => {
    if (newConvType === "direct") {
      if (!selectedUserId) {
        toast.error("Sélectionnez un utilisateur");
        return;
      }
      const selectedUser = allUsers.find(u => u.id === selectedUserId);
      createConversationMutation.mutate({
        type: "direct",
        participants: [
          { user_email: currentUser.email, user_name: currentUser.full_name, joined_at: new Date().toISOString() },
          { user_email: selectedUser.email, user_name: selectedUser.full_name, joined_at: new Date().toISOString() },
        ],
      });
    } else {
      if (!groupName.trim() || selectedGroupUsers.length === 0) {
        toast.error("Donnez un nom au groupe et ajoutez des participants");
        return;
      }
      const participants = [
        { user_email: currentUser.email, user_name: currentUser.full_name, joined_at: new Date().toISOString() },
        ...selectedGroupUsers.map(uid => {
          const u = allUsers.find(user => user.id === uid);
          return { user_email: u.email, user_name: u.full_name, joined_at: new Date().toISOString() };
        }),
      ];
      createConversationMutation.mutate({
        type: "group",
        name: groupName.trim(),
        participants,
      });
    }
  };

  const getUnreadCounts = () => {
    const counts = {};
    conversations.forEach(conv => {
      const convMessages = allMessages.filter(m => m.conversation_id === conv.id);
      const unread = convMessages.filter(
        m => m.sender_email !== currentUser?.email && !m.read_by?.includes(currentUser?.email)
      );
      counts[conv.id] = unread.length;
    });
    return counts;
  };

  const unreadCounts = getUnreadCounts();

  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-slate-50 flex">
      {/* Desktop: Side by side */}
      <div className="hidden md:flex w-full">
        <div className="w-80 flex-shrink-0">
          <ConversationList
            conversations={conversations}
            currentUser={currentUser}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
            unreadCounts={unreadCounts}
            onNewConversation={() => setShowNewConversationDialog(true)}
          />
        </div>
        <div className="flex-1">
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              currentUser={currentUser}
              onBack={() => setSelectedConversation(null)}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-white">
              <div className="text-center text-slate-400">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Sélectionnez une conversation</p>
                <p className="text-sm">ou créez-en une nouvelle</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: One view at a time */}
      <div className="md:hidden w-full">
        {!selectedConversation ? (
          <ConversationList
            conversations={conversations}
            currentUser={currentUser}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
            unreadCounts={unreadCounts}
            onNewConversation={() => setShowNewConversationDialog(true)}
          />
        ) : (
          <ChatWindow
            conversation={selectedConversation}
            currentUser={currentUser}
            onBack={() => setSelectedConversation(null)}
          />
        )}
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={showNewConversationDialog} onOpenChange={setShowNewConversationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={newConvType} onValueChange={setNewConvType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Message privé
                    </div>
                  </SelectItem>
                  <SelectItem value="group">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Groupe
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newConvType === "direct" ? (
              <div>
                <Label>Utilisateur</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.filter(u => u.email !== currentUser?.email).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div>
                  <Label>Nom du groupe</Label>
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ex: Équipe mission Goma"
                  />
                </div>
                <div>
                  <Label>Participants ({selectedGroupUsers.length} sélectionné(s))</Label>
                  <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                    {allUsers.filter(u => u.email !== currentUser?.email).map(u => (
                      <label key={u.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedGroupUsers.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGroupUsers([...selectedGroupUsers, u.id]);
                            } else {
                              setSelectedGroupUsers(selectedGroupUsers.filter(id => id !== u.id));
                            }
                          }}
                        />
                        <span className="text-sm">{u.full_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button
              onClick={handleCreateConversation}
              disabled={createConversationMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Créer la conversation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}