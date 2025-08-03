import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-8 bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}