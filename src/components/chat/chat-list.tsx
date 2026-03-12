import { useChat } from "@/hooks/use-chat";
import { useEffect, useMemo, useState } from "react";
import { Spinner } from "../ui/spinner";
import ChatListItem from "./chat-list-item";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import ChatListHeader from "./chat-list-header";
import { useSocket } from "@/hooks/use-socket";
import type { ChatType, MessageType } from "@/types/chat.type";

function ChatList() {
    const navigate = useNavigate();
    const { socket } = useSocket();

    const {
        fetchChats,
        chats,
        isChatsLoading,
        addNewChat,
        updateChatLastMessage,
    } = useChat();
    const [searchQuery, setSearchQuery] = useState("");
    const { user } = useAuth();

    const currentUserId = user?._id || null;

    const filterChats = useMemo(() => {
        if (!chats) return [];

        return chats.filter(
            (chat) =>
                chat.groupName
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                chat.participants?.some(
                    (p) =>
                        p._id !== currentUserId &&
                        p.name
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()),
                ),
        );
    }, [chats, searchQuery, currentUserId]);

    const onRoute = (id: string) => {
        navigate(`/chat/${id}`);
    };

    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    useEffect(() => {
        if (!socket) return;

        const handleNewChat = (newChat: ChatType) => {
            console.log("Recieved new chat", newChat);
            addNewChat(newChat);
        };

        socket.on("chat:new", handleNewChat);

        return () => {
            socket.off("chat:new", handleNewChat);
        };
    }, [addNewChat, socket]);

    useEffect(() => {
        if (!socket) return;
        const handleUpdateChat = (data: {
            chatId: string;
            lastMessage: MessageType;
        }) => {
            console.log("Recieved new chat", data.lastMessage);
            updateChatLastMessage(data.chatId, data.lastMessage);
        };
        socket.on("chat:update", handleUpdateChat);

        return () => {
            socket.off("chat:update", handleUpdateChat);
        };
    }, [socket, updateChatLastMessage]);

    return (
        <div
            className="fixed inset-y-0 *:pb-20 lg:pb-20 lg:max-w-94.75 lg:block border-r border-border 
                    bg-sidebar max-w-[calc(100%-40px)] w-full left-10 z-98"
        >
            <div className="flex-col">
                {/* Chatlist header */}
                <ChatListHeader onSearch={setSearchQuery} />

                <div className="flex-1 h[calc(100vh-100px)] overflow-y-auto">
                    <div className="px-2 pb-10 pt-1 space-y-1">
                        {isChatsLoading ? (
                            <div className="flex items-center justify-center">
                                <Spinner className="w-7 h-7" />
                            </div>
                        ) : filterChats.length === 0 ? (
                            <div className="flex items-center justify-center">
                                {searchQuery
                                    ? "No chat found"
                                    : "No chats created"}
                            </div>
                        ) : (
                            filterChats?.map((chat) => (
                                <ChatListItem
                                    key={chat._id}
                                    chat={chat}
                                    onClick={() => onRoute(chat._id)}
                                    currentUserId={currentUserId}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatList;
