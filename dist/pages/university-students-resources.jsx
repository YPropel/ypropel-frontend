"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UniversityStudentsResources;
const AuthGuard_1 = __importDefault(require("../components/AuthGuard"));
function UniversityStudentsResources() {
    return (<AuthGuard_1.default>
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">University Students Resources</h1>
      <p>Access a variety of tools and resources for university students.</p>
    </div>
      </AuthGuard_1.default>);
}
