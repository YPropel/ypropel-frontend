//-- pre-college summer programs admin backend page to add and delete programs
import React from "react";
import SummerProgramsAdmin from "../../components/admin/SummerProgramsAdmin";



export default function AdminSummerProgramsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-blue-900 mb-4">Manage Summer Programs</h1>
      <SummerProgramsAdmin />
    </div>
  );
}
