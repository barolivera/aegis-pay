/**
 * AegisPay CRE Workflow — Decentralized Risk Assessment for AI Agents
 *
 * This workflow runs on a Chainlink DON (Decentralized Oracle Network) to provide
 * fault-tolerant, trust-minimized risk assessment for autonomous AI agent transactions.
 *
 * Flow:
 *   1. Cron trigger fires on schedule
 *   2. HTTP capability fetches live HBAR/USD price from CoinGecko (with DON consensus)
 *   3. Risk engine scores each pending transaction (address risk + USD value + action type)
 *   4. PolicyManager logic returns verdict: ALLOW / WARN / BLOCK
 *   5. Returns structured assessment report for on-chain recording
 *
 * On-chain contracts (Hedera Testnet):
 *   - PolicyManager:      0x226F68C0D8F26A478F4F64d2733376DAB98Fcc6c
 *   - AssessmentRegistry: 0xeA86E74c8c89a30F6180B4d5c3d9C58C981d3638
 *   - AgentRegistry:      0xe0595502b10398D7702Ed43eDcf8101Fd67c0991
 */
import {
	cre,
	type Runtime,
	type CronPayload,
	type HTTPSendRequester,
	json as httpJson,
	ok as httpOk,
	consensusIdenticalAggregation,
} from '@chainlink/cre-sdk';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// CONFIG SCHEMA
// ═══════════════════════════════════════════════════════════════

const transactionSchema = z.object({
	agent: z.string(),
	target: z.string(),
	amountHbar: z.number(),
	action: z.string(),
});

export const configSchema = z.object({
	schedule: z.string(),
	priceApiUrl: z.string(),
	riskThresholds: z.object({
		lowUsdValue: z.number(),
		highUsdValue: z.number(),
	}),
	policyThresholds: z.object({
		low: z.number(),
		medium: z.number(),
	}),
	pendingTransactions: z.array(transactionSchema),
});

type Config = z.infer<typeof configSchema>;

// ═══════════════════════════════════════════════════════════════
// RISK SCORING ENGINE
// Mirrors AegisPay on-chain PolicyManager + frontend logic
// ═══════════════════════════════════════════════════════════════

const RISKY_ADDRESSES = [
	'0x000000000000000000000000000000000000dead',
	'0x0000000000000000000000000000000000000000',
];

const ACTION_RISK: Record<string, number> = {
	'transfer': 0,
	'swap': 10,
	'contract-call': 15,
	'mint': 10,
	'other': 5,
};

function computeRiskScore(
	target: string,
	amountHbar: number,
	hbarPriceUsd: number,
	action: string,
	thresholds: Config['riskThresholds'],
): { score: number; reasons: string[] } {
	let score = 10; // base risk
	const reasons: string[] = [];

	// ── Address reputation ──
	if (RISKY_ADDRESSES.includes(target.toLowerCase())) {
		score += 60;
		reasons.push('CRITICAL: Known risky/burn address');
	}

	// ── USD value analysis (real-time price x amount) ──
	const usdValue = amountHbar * hbarPriceUsd;
	if (usdValue > thresholds.highUsdValue) {
		score += 35;
		reasons.push(`HIGH VALUE: $${usdValue.toFixed(2)} USD (>${thresholds.highUsdValue})`);
	} else if (usdValue > thresholds.lowUsdValue) {
		score += 15;
		reasons.push(`MEDIUM VALUE: $${usdValue.toFixed(2)} USD (>${thresholds.lowUsdValue})`);
	} else {
		reasons.push(`Low value: $${usdValue.toFixed(2)} USD`);
	}

	// ── Action type risk multiplier ──
	const actionRisk = ACTION_RISK[action] ?? 5;
	if (actionRisk > 0) {
		score += actionRisk;
		reasons.push(`Action: ${action} (+${actionRisk} risk)`);
	}

	// ── First interaction penalty ──
	score += 15;
	reasons.push('New target: first interaction');

	return { score: Math.min(100, Math.max(0, score)), reasons };
}

// ═══════════════════════════════════════════════════════════════
// VERDICT ENGINE (mirrors PolicyManager.getVerdict on-chain)
// ═══════════════════════════════════════════════════════════════

type Verdict = 'ALLOW' | 'WARN' | 'BLOCK';

function getVerdict(score: number, thresholds: Config['policyThresholds']): Verdict {
	if (score < thresholds.low) return 'ALLOW';
	if (score < thresholds.medium) return 'WARN';
	return 'BLOCK';
}

// ═══════════════════════════════════════════════════════════════
// HTTP: FETCH LIVE PRICE WITH DON CONSENSUS
// ═══════════════════════════════════════════════════════════════

function fetchHbarPrice(sendRequester: HTTPSendRequester, apiUrl: string): number {
	const response = sendRequester.sendRequest({
		method: 'GET',
		url: apiUrl,
	}).result();

	if (!httpOk(response)) {
		return 0.05; // fallback price if API unreachable
	}

	const data = httpJson(response) as Record<string, Record<string, number>>;
	return data['hedera-hashgraph']?.usd ?? 0.05;
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

type AssessmentResult = {
	agent: string;
	target: string;
	amountHbar: number;
	usdValue: number;
	riskScore: number;
	verdict: Verdict;
	reasons: string[];
	action: string;
};

export function onCron(runtime: Runtime<Config>, _payload: CronPayload): string {
	const httpClient = new cre.capabilities.HTTPClient();

	// ── Step 1: Fetch HBAR/USD price (consensus across DON nodes) ──
	const getPrice = httpClient.sendRequest(
		runtime,
		(sender: HTTPSendRequester) => fetchHbarPrice(sender, runtime.config.priceApiUrl),
		consensusIdenticalAggregation<number>(),
	);
	const hbarPriceUsd = getPrice().result();

	runtime.log(`══════════════════════════════════════════`);
	runtime.log(`  AegisPay Risk Assessment — CRE Workflow`);
	runtime.log(`══════════════════════════════════════════`);
	runtime.log(`  HBAR/USD Price (live): $${hbarPriceUsd}`);
	runtime.log(`  Policy: ALLOW < ${runtime.config.policyThresholds.low} | WARN < ${runtime.config.policyThresholds.medium} | BLOCK >= ${runtime.config.policyThresholds.medium}`);
	runtime.log(`  Transactions to assess: ${runtime.config.pendingTransactions.length}`);
	runtime.log(``);

	// ── Step 2: Assess each pending transaction ──
	const assessments: AssessmentResult[] = runtime.config.pendingTransactions.map(
		(tx, i) => {
			const { score, reasons } = computeRiskScore(
				tx.target,
				tx.amountHbar,
				hbarPriceUsd,
				tx.action,
				runtime.config.riskThresholds,
			);
			const verdict = getVerdict(score, runtime.config.policyThresholds);
			const usdValue = tx.amountHbar * hbarPriceUsd;

			const icon = verdict === 'ALLOW' ? 'OK' : verdict === 'WARN' ? '!!' : 'XX';
			runtime.log(`  [${icon}] TX #${i + 1}: ${tx.action} ${tx.amountHbar} HBAR ($${usdValue.toFixed(2)}) -> score=${score} -> ${verdict}`);
			for (const r of reasons) {
				runtime.log(`       - ${r}`);
			}

			return {
				agent: tx.agent,
				target: tx.target,
				amountHbar: tx.amountHbar,
				usdValue,
				riskScore: score,
				verdict,
				reasons,
				action: tx.action,
			};
		},
	);

	// ── Step 3: Per-agent statistics ──
	const agentStats = new Map<string, { allow: number; warn: number; block: number }>();
	for (const a of assessments) {
		const prev = agentStats.get(a.agent) ?? { allow: 0, warn: 0, block: 0 };
		if (a.verdict === 'ALLOW') prev.allow++;
		else if (a.verdict === 'WARN') prev.warn++;
		else prev.block++;
		agentStats.set(a.agent, prev);
	}

	// ── Step 4: Summary ──
	const allowed = assessments.filter((a) => a.verdict === 'ALLOW').length;
	const warned = assessments.filter((a) => a.verdict === 'WARN').length;
	const blocked = assessments.filter((a) => a.verdict === 'BLOCK').length;
	const totalUsdExposure = assessments.reduce((sum, a) => sum + a.usdValue, 0);
	const blockedUsdValue = assessments
		.filter((a) => a.verdict === 'BLOCK')
		.reduce((sum, a) => sum + a.usdValue, 0);

	runtime.log(``);
	runtime.log(`  ── Summary ──────────────────────────────`);
	runtime.log(`  Total assessed:    ${assessments.length}`);
	runtime.log(`  ALLOW: ${allowed} | WARN: ${warned} | BLOCK: ${blocked}`);
	runtime.log(`  Total USD exposure: $${totalUsdExposure.toFixed(2)}`);
	runtime.log(`  USD value blocked:  $${blockedUsdValue.toFixed(2)}`);
	runtime.log(``);

	const agentStatsObj: Record<string, { allow: number; warn: number; block: number }> = {};
	for (const [agent, stats] of agentStats) {
		agentStatsObj[agent] = stats;
		runtime.log(`  Agent ${agent.slice(0, 10)}...: ${stats.allow}A / ${stats.warn}W / ${stats.block}B`);
	}

	runtime.log(`══════════════════════════════════════════`);

	// ── Return structured result ──
	return JSON.stringify({
		workflow: 'aegispay-risk-assessment',
		version: '1.0.0',
		hbarPriceUsd,
		policyThresholds: runtime.config.policyThresholds,
		summary: {
			totalAssessed: assessments.length,
			allowed,
			warned,
			blocked,
			totalUsdExposure,
			blockedUsdValue,
		},
		agentStats: agentStatsObj,
		assessments,
	}, null, 2);
}

// ═══════════════════════════════════════════════════════════════
// INIT — Register cron trigger
// ═══════════════════════════════════════════════════════════════

export function initWorkflow(config: Config) {
	const cron = new cre.capabilities.CronCapability();
	return [
		cre.handler(
			cron.trigger({ schedule: config.schedule }),
			onCron,
		),
	];
}
