import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import type { MessageType } from "@/types/chat.type";
import { useEffect, useRef, useState } from "react";
import ChatBodyMessage from "./chat-body-message";

interface Props {
    chatId: string | null;
    messages: MessageType[];
    onReply: (message: MessageType) => void;
}
const ChatBody = ({ chatId, messages, onReply }: Props) => {
    const { socket } = useSocket();
    const { addNewMessage, addOrUpdateMessage } = useChat();
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [, setAiChunk] = useState<string>("");

    useEffect(() => {
        if (!chatId) return;
        if (!socket) return;

        const handleNewMessage = (msg: MessageType) =>
            addNewMessage(chatId, msg);

        socket.on("message:new", handleNewMessage);
        return () => {
            socket.off("message:new", handleNewMessage);
        };
    }, [socket, chatId, addNewMessage]);

    useEffect(() => {
        if (!chatId) return;
        if (!socket) return;

        const handleAIStream = ({
            chatId: streamChatId,
            chunk,
            done,
            message,
            // sender,
        }: {
            chatId: string;
            chunk: string;
            done: boolean;
            message: MessageType;
        }) => {
            if (streamChatId !== chatId) return;
            const lastMessage = messages.at(-1);
            if (!lastMessage?._id && lastMessage?.streaming) return;

            if (chunk?.trim() && !done) {
                setAiChunk((prev) => {
                    const newContent = prev + chunk;
                    addOrUpdateMessage(
                        chatId,
                        { ...lastMessage, content: newContent } as MessageType,
                        lastMessage?._id,
                    );
                    return newContent;
                });
            }
            if (done) {
                console.log("Ai fullreponse", message);
                setAiChunk("");
            }
        };

        socket.on("chat:ai", handleAIStream);

        return () => {
            socket.off("chat:ai", handleAIStream);
        };
    }, [socket, chatId, messages, addOrUpdateMessage]);

    useEffect(() => {
        if (!messages.length) return;
        const lastMsg = messages[messages.length - 1];
        const isStreaming = lastMsg?.streaming;
        bottomRef.current?.scrollIntoView({
            behavior: isStreaming ? "auto" : "smooth",
        });
    }, [messages]);

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col px-3 py-2">
            {messages.map((message) => (
                <ChatBodyMessage
                    key={message._id}
                    message={message}
                    onReply={onReply}
                />
            ))}
            <div ref={bottomRef} />
        </div>
    );
};

export default ChatBody;
