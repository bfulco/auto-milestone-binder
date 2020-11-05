"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickLatestSprint = exports.existsMilestone = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
exports.existsMilestone = (payload) => {
    var _a, _b;
    if ((_a = payload.issue) === null || _a === void 0 ? void 0 : _a.milestone) {
        return true;
    }
    if ((_b = payload.pull_request) === null || _b === void 0 ? void 0 : _b.milestone) {
        return true;
    }
    return false;
};
exports.pickLatestSprint = (milestones) => {
    const sortedMilestones = milestones.data
        .filter((v) => v.title.match(/Sprint \d+/))
        .sort((a, b) => {
        const s1 = a.title.substr(6, a.title.length - 1);
        const s2 = b.title.substr(6, b.title.length - 1);
        if (s1 < s2) {
            return -1;
        }
        else if (s1 > s2) {
            return 1;
        }
        return 0;
    }).reverse();
    return sortedMilestones[0];
};
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const { repo, payload, issue } = github.context;
        // Do nothing if its not a pr or issue
        const isIssue = !!payload.issue;
        const isPR = !!payload.pull_request;
        if (!isIssue && !isPR) {
            console.log('The event that triggered this action was not a pull request or issue, skipping.');
            return;
        }
        if (exports.existsMilestone(payload)) {
            console.log('Milestone already exist, skipping.');
            return;
        }
        if ((isPR && payload.action !== "opened")
            || (isIssue && payload.action !== "assigned")) {
            console.log('Not the right action, no work to be done.');
            return;
        }
        // Get client and context
        const client = new github.GitHub(core.getInput('github-token', { required: true }));
        const milestones = yield client.issues.listMilestonesForRepo(Object.assign(Object.assign({}, repo), { state: 'open' }));
        if (milestones.data.length === 0) {
            console.log('There are no milestones, skipping.');
            return;
        }
        const smallestVersion = exports.pickLatestSprint(milestones);
        yield client.issues.update(Object.assign(Object.assign({}, repo), { issue_number: issue.number, milestone: smallestVersion.number }));
        core.setOutput('milestone', smallestVersion);
    });
}
run().catch(err => {
    core.setFailed(err.message);
});
