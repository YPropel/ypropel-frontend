"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminSummerProgramsPage;
//-- pre-college summer programs admin backend page to add and delete programs
const react_1 = __importDefault(require("react"));
const SummerProgramsAdmin_1 = __importDefault(require("../../components/admin/SummerProgramsAdmin"));
function AdminSummerProgramsPage() {
    return (<div className="p-6">
      <h1 className="text-2xl font-bold text-blue-900 mb-4">Manage Summer Programs</h1>
      <SummerProgramsAdmin_1.default />
    </div>);
}
