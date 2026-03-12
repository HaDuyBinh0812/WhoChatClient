import type { UserType } from "./auth.type";

export type ChatType = {
    _id: string;
    lastMessage: MessageType;
    participants: UserType[];
    isGroup: boolean;
    isAiChat: boolean;
    createdBy: string;
    groupName?: string;
    createdAt: string;
    updatedAt: string;
    // only fontend
    status?: string;
};

export type MessageType = {
    _id: string;
    content: string | null;
    image: string | null;
    sender: UserType | null;
    replyTo: MessageType | null;
    chatId: string;
    createdAt: string;
    updatedAt: string;

    //only frontend
    status?: string;
    streaming?: boolean;
};

export type createMessengeType = {
    chatId: string | null;
    content?: string;
    image?: string;
    replyTo?: MessageType | null;
};

export type createChatType = {
    participantId?: string;
    isGroup?: boolean;
    participants?: string[];
    groupName?: string;
};
