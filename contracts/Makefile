-include .env

.PHONY: build test deploy

build:
	forge build

test:
	forge test -vvv

deploy:
	forge script script/Deploy.s.sol:Deploy \
		--rpc-url $(HEDERA_RPC_URL) \
		--broadcast \
		--slow \
		-vvv
