"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  groupId: string;
  isMember: boolean;
}

export default function JoinLeaveGroupButton({ groupId, isMember }: Props) {
  const [isMemberState, setIsMemberState] = useState(isMember);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);

    setIsMemberState(!isMemberState);

    try {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
      });
      if (!res.ok) {

        setIsMemberState(isMemberState);
      }
      router.refresh();
    } catch (error) {
      console.error(error);
      setIsMemberState(isMemberState); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-4 py-2 rounded-md font-semibold text-white transition-colors disabled:opacity-50 ${
        isMemberState
          ? 'bg-red-600 hover:bg-red-700'
          : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {loading ? '...' : isMemberState ? 'Leave Group' : 'Join Group'}
    </button>
  );
}