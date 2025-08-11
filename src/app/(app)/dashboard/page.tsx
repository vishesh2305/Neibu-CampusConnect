import PostFeed from '@/components/PostFeed';
import CreatePost from '@/components/CreatePost';
export default function Dashboard() {
  return (
    <div >

      <CreatePost />
      <PostFeed />
    </div>
  );
}