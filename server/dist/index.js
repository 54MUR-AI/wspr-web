"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = require("./config");
const auth_1 = __importDefault(require("./routes/auth"));
const webauthn_routes_1 = __importDefault(require("./routes/webauthn.routes"));
const recovery_routes_1 = __importDefault(require("./routes/recovery.routes"));
const error_1 = require("./middleware/error");
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    maxAge: 86400 // 24 hours in seconds
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // Maximum requests per window
});
app.use(limiter);
// Logging middleware
app.use((0, morgan_1.default)(config_1.NODE_ENV === 'development' ? 'dev' : 'combined'));
// Test route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/auth/webauthn', webauthn_routes_1.default);
app.use('/api/auth/recovery', recovery_routes_1.default);
// Error handling
app.use(error_1.errorHandler);
// Start server
app.listen(config_1.PORT, () => {
    console.log(`Server running on port ${config_1.PORT} in ${config_1.NODE_ENV} mode`);
    console.log(`API available at http://localhost:${config_1.PORT}`);
});
