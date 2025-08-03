import CreateGroupForm from "../../../components/CreateGroupForm";
import GroupList from "../../../components/GroupList";

export default function GroupsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Groups & Communities</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <GroupList />
        </div>
        <div>
          <CreateGroupForm />
        </div>
      </div>
    </div>
  );
}