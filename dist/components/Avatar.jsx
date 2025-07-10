"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Avatar;
const react_1 = __importStar(require("react"));
function getInitials(name) {
    const names = name.trim().split(" ");
    if (names.length === 0)
        return "";
    if (names.length === 1)
        return names[0][0].toUpperCase();
    return (names[0][0] + names[1][0]).toUpperCase();
}
function Avatar({ name, photoUrl, size = 32 }) {
    const [imgError, setImgError] = (0, react_1.useState)(false);
    const initials = getInitials(name);
    const style = {
        width: size,
        height: size,
        lineHeight: `${size}px`,
        fontSize: size / 2,
    };
    if (!photoUrl || photoUrl.trim() === "" || imgError) {
        return (<div style={style} className="rounded-full bg-gray-400 text-white font-semibold text-center select-none">
        {initials}
      </div>);
    }
    return (<img src={photoUrl} alt={name} style={style} className="rounded-full object-cover" onError={() => setImgError(true)}/>);
}
