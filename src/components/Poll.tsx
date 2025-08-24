// src/components/Poll.tsx

"use client";

import { useSession } from 'next-auth/react';
import { PostProps } from './Post';






interface PollPropsUI{
  post: PostProps;
  onVote: (updatedPost: PostProps) => void;
}

export default function Poll({ post, onVote }: PollPropsUI) {
  const { data: session } = useSession();

  const pollOptions = post.poll?.options || [];
  const totalVotes = pollOptions.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);

  const hasVoted = pollOptions.some(opt => opt.votes?.includes(session?.user?.id || ''));
  const handleVote = async (optionIndex: number) => {
    if (hasVoted) return;

    try {
      const res = await fetch(`/api/posts/${post._id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIndex }),
      });

      if (res.ok) {
        const updatedPost: PostProps = await res.json();
        onVote(updatedPost); // Use the callback to update the parent component
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to vote.');
      }
    } catch (error) {
      console.error('Voting error', error);
    }
  };

  return (
    <div className="my-4 space-y-2">
      {pollOptions.map((option, index) => {
        const voteCount = option.votes.length;
        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
        const isVotedFor = option.votes.includes(session?.user?.id || '');

        return (
          <div key={index}>
            <button
              onClick={() => handleVote(index)}
              disabled={hasVoted}
              className="w-full text-left p-2 border border-gray-600 rounded-md hover:bg-gray-700 disabled:cursor-not-allowed"
            >
              <div className="flex justify-between items-center">
                <span className={`font-medium ${isVotedFor ? 'text-blue-400' : 'text-white'}`}>{option.text}</span>
                {hasVoted && <span className="text-sm text-gray-400">{percentage.toFixed(0)}%</span>}
              </div>
              {hasVoted && (
                <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              )}
            </button>
          </div>
        );
      })}
      <p className="text-xs text-gray-500 text-right">{totalVotes} votes</p>
    </div>
  );
}