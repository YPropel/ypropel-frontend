"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Layout;
const Sidebar_1 = __importDefault(require("./Sidebar"));
const Topbar_1 = __importDefault(require("./Topbar"));
function Layout({ children }) {
    return (<div className="flex">
      <Sidebar_1.default />
      <div className="flex-1 min-h-screen bg-gray-50">
        <Topbar_1.default />
        <main className="p-4">{children}</main>
      </div>
    </div>);
}
