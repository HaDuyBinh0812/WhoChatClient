/* eslint-disable @typescript-eslint/no-explicit-any */
import { API } from "@/lib/axios-client";
import type { UserType } from "@/types/auth.type";
import type {
    ChatType,
    createChatType,
    createMessengeType,
    MessageType,
} from "@/types/chat.type";
import { toast } from "sonner";
import { create } from "zustand";
import { useAuth } from "./use-auth";
import { generateUUID } from "@/lib/helper";

interface ChatState {
    chats: ChatType[];
    users: UserType[];
    singleChat: {
        chat: ChatType;
        messages: MessageType[];
    } | null;

    isChatsLoading: boolean;
    isUsersLoading: boolean;
    isCreatingChat: boolean;
    isSingleChatLoading: boolean;
    isSendingMessage: boolean;

    fetchAllUser: () => void;
    fetchChats: () => void;
    createChat: (payload: createChatType) => Promise<ChatType | null>;
    fetchSingleChat: (chatId: string) => void;
    sendMessage: (payload: createMessengeType, isAiChat?: boolean) => void;

    addNewChat: (newChat: ChatType) => void;
    addNewMessage: (chatId: string, message: MessageType) => void;

    addOrUpdateMessage: (
        chatId: string,
        msg: MessageType,
        tempId?: string,
    ) => void;

    updateChatLastMessage: (chatId: string, lastMessage: MessageType) => void;
}

export const useChat = create<ChatState>()((set, get) => ({
    chats: [],
    users: [],
    singleChat: null,
    isChatsLoading: false,
    isUsersLoading: false,
    isCreatingChat: false,
    isSingleChatLoading: false,
    isSendingMessage: false,

    fetchAllUser: async () => {
        set({ isUsersLoading: true });
        try {
            const { data } = await API.get("/user/all");
            set({ users: data.users });
        } catch (error: any) {
            toast.error(
                error?.response?.data.message || "Falied to fetch user",
            );
        } finally {
            set({ isUsersLoading: false });
        }
    },

    fetchChats: async () => {
        set({ isChatsLoading: true });
        try {
            const { data } = await API.get("/chat/all");
            set({ chats: data.chats });
        } catch (error: any) {
            toast.error(
                error?.response?.data.message || "Failed to fetch chats",
            );
        } finally {
            set({ isChatsLoading: false });
        }
    },

    createChat: async (payload: createChatType) => {
        set({ isCreatingChat: true });
        try {
            const response = await API.post("/chat/create", {
                ...payload,
            });
            get().addNewChat(response.data.chat);
            return response.data.chat;
        } catch (error: any) {
            toast.error(
                error?.response?.data.message || "Failed to create chat",
            );
            return null;
        } finally {
            set({ isCreatingChat: false });
        }
    },

    sendMessage: async (payload: createMessengeType, isAiChat?: boolean) => {
        set({ isSendingMessage: true });

        const { chatId, replyTo, content, image } = payload;
        const { user } = useAuth.getState();
        const chat = get().singleChat?.chat;
        const aiSender = chat?.participants.find((p) => p.isAI);

        if (!chatId || !user?._id) return;

        const tempUserId = generateUUID();
        const tempAiId = generateUUID();

        const tempMessage = {
            _id: tempUserId,
            chatId,
            content: content || null,
            image: image || null,
            sender: user,
            replyTo: replyTo || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: !isAiChat ? "sending..." : "",
        };
        // set((state) => {
        //     if (state.singleChat?.chat?._id !== chatId) return state;
        //     return {
        //         singleChat: {
        //             ...state.singleChat,
        //             messages: [...state.singleChat.messages, tempMessage],
        //         },
        //     };
        // });
        get().addOrUpdateMessage(chatId, tempMessage, tempUserId);

        if (isAiChat && aiSender) {
            const tempAiMessage = {
                _id: tempAiId,
                chatId,
                content: "",
                sender: aiSender,
                image: null,
                replyTo: null,
                streaming: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            get().addOrUpdateMessage(chatId, tempAiMessage, tempAiId);
        }

        try {
            const { data } = await API.post("/chat/message/send", {
                chatId,
                content,
                image,
                replyToId: replyTo?._id,
            });
            const { userMessage, aiResponse } = data;

            // Replace the temp user message
            get().addOrUpdateMessage(chatId, userMessage, tempUserId);

            //AI
            if (isAiChat && aiSender) {
                // Replace the temp user message
                get().addOrUpdateMessage(chatId, aiResponse, tempAiId);
            }

            // set((state) => {
            //     if (!state.singleChat) return state;
            //     return {
            //         singleChat: {
            //             ...state.singleChat,
            //             messages: state.singleChat.messages.map((msg) =>
            //                 msg._id === tempUserId ? userMessage : msg,
            //             ),
            //         },
            //     };
            // });
        } catch (error: any) {
            toast.error(
                error?.response?.data.message || "Failed to create chat",
            );
        } finally {
            set({ isSendingMessage: false });
        }
    },

    addOrUpdateMessage: (chatId: string, msg: MessageType, tempId?: string) => {
        const singleChat = get().singleChat;
        if (!singleChat || singleChat.chat._id !== chatId) return;

        const messages = singleChat.messages;
        const msgIndex = tempId
            ? messages.findIndex((msg) => msg._id === tempId)
            : -1;

        let updateMessages;
        if (msgIndex !== -1) {
            updateMessages = messages.map((message, i) =>
                i === msgIndex ? { ...msg } : message,
            );
        } else {
            updateMessages = [...messages, msg];
        }

        set({
            singleChat: {
                chat: singleChat.chat,
                messages: updateMessages,
            },
        });
    },

    addNewMessage: (chatId, message) => {
        const chat = get().singleChat;
        if (chat?.chat._id === chatId) {
            set({
                singleChat: {
                    chat: chat.chat,
                    messages: [...chat.messages, message],
                },
            });
        }
    },

    fetchSingleChat: async (chatId: string) => {
        set({ isSingleChatLoading: true });
        try {
            const { data } = await API.get(`/chat/${chatId}`);
            set({ singleChat: data });
        } catch (error: any) {
            toast.error(
                error?.response?.data.message || "Failed to create chat",
            );
        } finally {
            set({ isSingleChatLoading: false });
        }
    },

    addNewChat: (newChat: ChatType) => {
        set((state) => ({
            chats: [
                newChat,
                ...state.chats.filter((chat) => chat._id !== newChat._id),
            ],
        }));
    },

    updateChatLastMessage: (chatId, lastMessage) => {
        set((state) => {
            const chat = state.chats.find((chat) => chat._id === chatId);
            if (!chat) return state;
            return {
                chats: [
                    { ...chat, lastMessage },
                    ...state.chats.filter((chat) => chat._id !== chatId),
                ],
            };
        });
    },
}));
