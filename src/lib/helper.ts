import { useSocket } from "@/hooks/use-socket";
import type { ChatType } from "@/types/chat.type";
import { format, isThisWeek, isToday, isYesterday } from "date-fns";
import { v4 as uuidv4 } from "uuid";

export const isUserOnline = (userId?: string) => {
    if (!userId) return false;
    const { onlineUsers } = useSocket.getState();
    return onlineUsers.includes(userId);
};

export const getOtherUserAndGroup = (
    chat: ChatType,
    currentUser: string | null,
) => {
    const isGroup = chat?.isGroup;
    if (isGroup) {
        return {
            name: chat.groupName || "Unnamed Group",
            subheading: `${chat.participants.length} members`,
            avatar: "",
            isGroup,
        };
    }
    const other = chat?.participants.find((p) => p._id !== currentUser);
    const isOnline = isUserOnline(other?._id ?? "");

    const subheading = other?.isAI
        ? "Assistant"
        : isOnline
          ? "Online"
          : "Offline";

    return {
        name: other?.name || "Unknow",
        subheading: subheading,
        avatar: other?.avatar || "",
        isGroup: false,
        isOnline,
        isAI: other?.isAI || false,
    };
};

export const formatChatTime = (date: string | Date) => {
    if (!date) return "";
    const newDate = new Date(date);
    if (isNaN(newDate.getTime())) return "Invalid Day";
    if (isToday(newDate)) return format(newDate, "h:mm a");
    if (isYesterday(newDate)) return "Yesterday";
    if (isThisWeek(newDate)) return format(newDate, "EEE");
    return format(newDate, "M/d");
};

export function generateUUID(): string {
    return uuidv4();
}
