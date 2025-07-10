"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UnauthorizedPage;
const react_1 = __importDefault(require("react"));
function UnauthorizedPage() {
    return (<div className="p-6 text-center">
      <h1 className="text-3xl font-bold text-red-600">🚫 Access Denied</h1>
      <p className="mt-2 text-lg text-gray-700">
        You do not have permission to view this page.
      </p>
    </div>);
}
