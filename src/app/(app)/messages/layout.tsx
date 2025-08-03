import ConversationList from "../../../components/ConversationList";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-full">
      <div className="md:col-span-1 lg:col-span-1 h-full">
        <ConversationList />
      </div>
      <main className="md:col-span-2 lg:col-span-3 h-full">
        {children}
      </main>
    </div>
  );
}