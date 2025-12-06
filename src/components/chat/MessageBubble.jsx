import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, CheckCheck } from "lucide-react";

export default function MessageBubble({ message, isOwn, showReadReceipts }) {
  const isRead = message.read_by && message.read_by.length > 1;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {!isOwn && (
          <span className="text-xs text-slate-500 mb-1 px-1">{message.sender_name}</span>
        )}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-slate-100 text-slate-900 rounded-bl-sm"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className="text-xs text-slate-400">
            {format(new Date(message.created_date), "HH:mm", { locale: fr })}
          </span>
          {isOwn && showReadReceipts && (
            <span className={`${isRead ? "text-blue-500" : "text-slate-400"}`}>
              {isRead ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}