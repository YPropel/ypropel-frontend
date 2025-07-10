import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen bg-gray-50">
        <Topbar />
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
