import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/authOptions";
import CreatePost from "../../../components/CreatePost";
import PostFeed from "../../../components/PostFeed";
export default async function Dashboard() {
  await getServerSession(authOptions);

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <CreatePost /> 
        <PostFeed />
      </div>
    </>
  );
}