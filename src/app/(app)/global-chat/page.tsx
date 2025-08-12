// src/app/(app)/global-chat/page.tsx

import GlobalChat from '../../../components/GlobalChat';

export default function GlobalChatPage() {
  return (
    <div className="h-full">
      <h1 className="text-3xl font-bold text-white mb-6">Global Chat</h1>
      <GlobalChat />
    </div>
  );
}