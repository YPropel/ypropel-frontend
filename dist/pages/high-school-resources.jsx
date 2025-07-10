"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HighSchoolResources;
const AuthGuard_1 = __importDefault(require("../components/AuthGuard"));
function HighSchoolResources() {
    return (<AuthGuard_1.default>
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold text-blue-900">High School Student Resources</h1>
      <ul className="list-disc pl-6 space-y-2 text-blue-800">
        <li><a href="/pre-college-summer" className="hover:underline">Pre-college Summer Programs</a></li>
        <li><a href="/sat-prep" className="hover:underline">SAT Prep Course</a></li>
        {/* Add more resources */}
      </ul>
    </div>
    </AuthGuard_1.default>);
}
