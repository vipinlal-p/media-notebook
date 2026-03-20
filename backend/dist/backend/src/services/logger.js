"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const main_1 = __importDefault(require("electron-log/main"));
main_1.default.initialize();
main_1.default.transports.file.level = 'info';
exports.logger = main_1.default;
