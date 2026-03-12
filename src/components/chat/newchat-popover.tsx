import { useChat } from "@/hooks/use-chat";
import { memo, useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import {
    ArrowLeft,
    PenBoxIcon,
    Search,
    UserIcon,
    UsersIcon,
} from "lucide-react";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "../ui/input-group";
import { Spinner } from "../ui/spinner";
import type { UserType } from "@/types/auth.type";
import AvatarWithBadge from "../avatar-with-badge";
import { Checkbox } from "../ui/checkbox";

export const NewChatPopover = memo(() => {
    const { fetchAllUser, users, createChat, isCreatingChat, isUsersLoading } =
        useChat();

    const [isOpen, setIsOpen] = useState(false);
    const [isGroupMode, setisGroupMode] = useState<boolean>(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUser, setSelectedUser] = useState<string[]>([]);
    const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchAllUser();
    }, [fetchAllUser]);

    const toggleUserSelection = (id: string) => {
        setSelectedUser((prev) =>
            prev.includes(id)
                ? prev.filter((userId) => userId !== id)
                : [...prev, id],
        );
    };

    const resetState = () => {
        setisGroupMode(false);
        setGroupName("");
        setSelectedUser([]);
    };

    const handleBack = () => {
        resetState();
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        resetState();
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUser?.length === 0) return;
        await createChat({
            isGroup: true,
            participants: selectedUser,
            groupName: groupName,
        });
        setIsOpen(false);
        resetState();
    };

    const handleCreateChat = async (userId: string) => {
        setLoadingUserId(userId);
        try {
            await createChat({
                isGroup: false,
                participantId: userId,
            });
            // setIsOpen(false);
            resetState();
        } finally {
            setLoadingUserId(null);
            setIsOpen(false);
            resetState();
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    onClick={() => setIsOpen(true)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                >
                    <PenBoxIcon className="h-5! w-5! stroke-1!" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-80 z-999 p-0 rounded-xl min-h-100 max-h-[80vh] flex flex-col"
            >
                <div className="border-b p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        {isGroupMode && (
                            <Button
                                variant={"ghost"}
                                size={"icon"}
                                onClick={handleBack}
                            >
                                <ArrowLeft />
                            </Button>
                        )}
                        <h3 className="text-lg font-semibold">
                            {isGroupMode ? "New Group" : "New Chat"}
                        </h3>

                        <InputGroup>
                            <InputGroupInput
                                value={isGroupMode ? groupName : ""}
                                onChange={
                                    isGroupMode
                                        ? (e) => setGroupName(e.target.value)
                                        : undefined
                                }
                                placeholder={
                                    isGroupMode
                                        ? "Enter group name"
                                        : "Search name"
                                }
                            />
                            <InputGroupAddon>
                                {isGroupMode ? <UsersIcon /> : <Search />}
                            </InputGroupAddon>
                        </InputGroup>
                    </div>
                    <div className="flex-1 justify-center overflow-y-auto px-1 py-1 space-y-1">
                        {isUsersLoading ? (
                            <Spinner />
                        ) : users && users.length === 0 ? (
                            <div className="text-center text-muted-foreground">
                                No users found
                            </div>
                        ) : !isGroupMode ? (
                            <>
                                <NewGroupItem
                                    disabled={isCreatingChat}
                                    onClick={() => setisGroupMode(true)}
                                />
                                {users?.map((user) => (
                                    <ChatUserItem
                                        key={user._id}
                                        user={user}
                                        isLoading={loadingUserId === user._id}
                                        disabled={loadingUserId !== null}
                                        onClick={handleCreateChat}
                                    />
                                ))}
                            </>
                        ) : (
                            <>
                                {users?.map((user) => (
                                    <GroupUserItem
                                        key={user._id}
                                        user={user}
                                        isSelected={selectedUser.includes(
                                            user._id,
                                        )}
                                        onToggle={toggleUserSelection}
                                    />
                                ))}
                            </>
                        )}
                    </div>

                    {isGroupMode && (
                        <div className="border-t p-3">
                            <Button
                                onClick={handleCreateGroup}
                                className="w-full"
                                disabled={
                                    isCreatingChat ||
                                    !groupName.trim() ||
                                    selectedUser.length === 0
                                }
                            >
                                {isCreatingChat && (
                                    <Spinner className="w-4 h-4" />
                                )}
                                Create Group
                            </Button>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
});

NewChatPopover.displayName = "NewChatPopover";

const UseAvatar = memo(({ user }: { user: UserType }) => {
    return (
        <>
            <AvatarWithBadge name={user.name} src={user.avatar || ""} />
            <div className="flex-1 min-w-0">
                <h5 className="text-[13.5px] font-semibold truncate">
                    {user.name}
                </h5>
                <p className="text-xs text-muted-foreground">
                    Hey there! I am using message
                </p>
            </div>
        </>
    );
});

UseAvatar.displayName = "UseAvatar";

const NewGroupItem = memo(
    ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => {
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className="w-full flex items-center gap-2 p-2 rounded-sm hover:bg-accent 
                transition-colors text-left disabled:opacity-50"
            >
                <div className="bg-primary/10 p-2 rounded-full">
                    <UserIcon className="size-4 text-primary" />
                </div>
                <span>New Group</span>
            </button>
        );
    },
);

NewGroupItem.displayName = "NewGroupItem";

const ChatUserItem = memo(
    ({
        user,
        isLoading,
        disabled,
        onClick,
    }: {
        user: UserType;
        isLoading: boolean;
        disabled: boolean;
        onClick: (id: string) => void;
    }) => {
        return (
            <button
                className="relative w-full flex items-center gap-2 p-2 rounded-sm 
            hover:bg-accent transition-colors text-left disabled:opacity-50"
                disabled={isLoading || disabled}
                onClick={() => onClick(user._id)}
            >
                <UseAvatar user={user} />
                {isLoading && (
                    <Spinner className="absolute right-2 w-4 h-4 ml-auto    " />
                )}
            </button>
        );
    },
);
ChatUserItem.displayName = "ChatUserItem";

const GroupUserItem = memo(
    ({
        user,
        isSelected,
        onToggle,
    }: {
        user: UserType;
        isSelected: boolean;
        onToggle: (id: string) => void;
    }) => {
        return (
            <label
                htmlFor=""
                role="button"
                className="w-full flex items-center gap-2 p-2 rounded-sm 
                hover:bg-accent transition-colors textleft disabled:opacity-50"
            >
                <UseAvatar user={user} />
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(user._id)}
                />
            </label>
        );
    },
);
GroupUserItem.displayName = "GroupUserItem";
