import ConversationList from "@/components/ConversationList";
import UserSearch from "@/components/UserSearch";

export default function MessagesPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-4">Messages</h1>
      <UserSearch />
      <ConversationList />
    </div>
  );
}
