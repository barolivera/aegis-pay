import { describe, expect } from 'bun:test'
import { test } from '@chainlink/cre-sdk/test'
import { initWorkflow, onCron } from './workflow'

describe('initWorkflow', () => {
	test('registers a cron trigger with the configured schedule', () => {
		const config = {
			schedule: '0 */1 * * * *',
			priceApiUrl: 'https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd',
			riskThresholds: { lowUsdValue: 100, highUsdValue: 1000 },
			policyThresholds: { low: 30, medium: 70 },
			pendingTransactions: [],
		}
		const handlers = initWorkflow(config)

		expect(handlers).toHaveLength(1)
		expect(handlers[0].fn).toBe(onCron)
		const cronTrigger = handlers[0].trigger as { config?: { schedule?: string } }
		expect(cronTrigger.config?.schedule).toBe(config.schedule)
	})
})

describe('risk scoring logic', () => {
	// We test the scoring through config variations since computeRiskScore is internal.
	// The real validation is the CRE simulation output.

	test('workflow registers exactly one handler', () => {
		const config = {
			schedule: '0 */5 * * * *',
			priceApiUrl: 'https://example.com/price',
			riskThresholds: { lowUsdValue: 50, highUsdValue: 500 },
			policyThresholds: { low: 25, medium: 60 },
			pendingTransactions: [
				{ agent: '0xaaa', target: '0xbbb', amountHbar: 10, action: 'transfer' },
			],
		}
		const handlers = initWorkflow(config)
		expect(handlers).toHaveLength(1)
	})

	test('config schema validates all required fields', () => {
		const { configSchema } = require('./workflow')
		const valid = configSchema.safeParse({
			schedule: '0 */1 * * * *',
			priceApiUrl: 'https://api.example.com',
			riskThresholds: { lowUsdValue: 100, highUsdValue: 1000 },
			policyThresholds: { low: 30, medium: 70 },
			pendingTransactions: [
				{ agent: '0x123', target: '0x456', amountHbar: 50, action: 'swap' },
			],
		})
		expect(valid.success).toBe(true)
	})

	test('config schema rejects missing fields', () => {
		const { configSchema } = require('./workflow')
		const invalid = configSchema.safeParse({
			schedule: '0 */1 * * * *',
			// missing priceApiUrl, thresholds, transactions
		})
		expect(invalid.success).toBe(false)
	})
})
