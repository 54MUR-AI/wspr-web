"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATABASE_URL = exports.JWT_SECRET = exports.NODE_ENV = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
_a = process.env, _b = _a.PORT, exports.PORT = _b === void 0 ? 3001 : _b, _c = _a.NODE_ENV, exports.NODE_ENV = _c === void 0 ? 'development' : _c, _d = _a.JWT_SECRET, exports.JWT_SECRET = _d === void 0 ? 'your-secret-key' : _d, _e = _a.DATABASE_URL, exports.DATABASE_URL = _e === void 0 ? 'postgresql://postgres:postgres@localhost:5432/wspr' : _e;
