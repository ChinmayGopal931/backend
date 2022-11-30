"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountValueRouter = void 0;
const express_1 = __importDefault(require("express"));
const database_service_1 = require("../services/database.service");
exports.accountValueRouter = express_1.default.Router();
exports.accountValueRouter.use(express_1.default.json());
exports.accountValueRouter.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allAccounts = (yield database_service_1.collections.sentimentAccounts
            .find({})
            .toArray());
        res.status(200).send(allAccounts);
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}));
exports.accountValueRouter.get("/:address", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const address = (_a = _req === null || _req === void 0 ? void 0 : _req.params) === null || _a === void 0 ? void 0 : _a.address;
    try {
        const query = { accountAddress: address };
        const account = (yield database_service_1.collections.sentimentAccounts
            .find(query)
            .toArray());
        res.status(200).send(account);
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}));
//# sourceMappingURL=account.router.js.map