"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MyApp;
const Layout_1 = __importDefault(require("../components/Layout"));
require("../styles/globals.css");
function MyApp({ Component, pageProps }) {
    return (<Layout_1.default>
      <Component {...pageProps}/>
    </Layout_1.default>);
}
