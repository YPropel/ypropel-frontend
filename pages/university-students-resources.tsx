import AuthGuard from "../components/AuthGuard";
export default function UniversityStudentsResources() {
  return (
      <AuthGuard>
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">University Students Resources</h1>
      <p>Access a variety of tools and resources for university students.</p>
    </div>
      </AuthGuard>
  );
}
