# AegisPay — Q&A para Judges

Guia rapida de respuestas para preguntas tipicas de judges en ETHGlobal Cannes.

---

## General

**¿Qué es AegisPay?**
Es una trust layer para agentes AI autonomos. Antes de que un agente ejecute un pago, AegisPay evalua el riesgo (score 0-100), aplica una politica on-chain (ALLOW/WARN/BLOCK), y registra cada decision como audit trail inmutable.

**¿Qué problema resuelve?**
Los agentes AI pueden pagar APIs, servicios y herramientas sin intervencion humana. Pero si un agente intenta enviar fondos a una direccion sospechosa o hacer una transaccion de alto valor, no hay nada que lo detenga. AegisPay es ese freno inteligente.

**¿Cómo funciona el risk scoring?**
Se calculan puntos segun: monto de la transaccion, reputacion de la direccion destino, tipo de accion (transfer, swap, contract-call), si es primera interaccion, y el valor en USD real (via Chainlink Price Feed). El score final va de 0 a 100.

**¿Qué pasa con cada verdict?**
- **ALLOW** (score < 30): El agente ejecuta automaticamente
- **WARN** (score 30-69): Se pausa y requiere aprobacion humana via Ledger
- **BLOCK** (score >= 70): Se cancela, no se mueven fondos
- En los 3 casos se registra la decision on-chain

---

## Hedera

**¿Por qué Hedera?**
Hedera tiene fees muy bajos (~$0.001 por tx), finality en 3-5 segundos, y es EVM-compatible. Ideal para registrar assessments on-chain sin que el costo sea prohibitivo. Un agente AI puede hacer muchas evaluaciones sin gastar casi nada.

**¿Qué contratos tienen deployados?**
Tres contratos en Hedera Testnet:
- **AgentRegistry**: Registra agentes AI con metadata (patron ERC-8004)
- **PolicyManager**: Define las reglas de riesgo (umbrales configurables)
- **AssessmentRegistry**: Guarda cada evaluacion como audit trail inmutable

**¿Están verificados?**
Si, los tres estan verificados en HashScan (el explorer de Hedera).

**¿Usan Hedera Agent Kit?**
Si, el agente autonomo usa Hedera Agent Kit SDK para hacer transfers nativos de HBAR con `AgentMode.AUTONOMOUS`.

**¿Qué es ERC-8004?**
Es un estandar para identidad on-chain de agentes AI. Nuestro AgentRegistry sigue ese patron: cada agente tiene owner, metadata URI, estado activo, y timestamp de registro.

---

## Chainlink

**¿Cómo usan Chainlink?**
De dos formas:

1. **CRE Workflow**: Un workflow que corre en el DON (Decentralized Oracle Network) de Chainlink. Fetcha el precio de HBAR en vivo, evalua el riesgo de transacciones pendientes, y retorna verdicts. Usa consensus entre nodos para validar el precio.

2. **Price Feed on-chain**: PolicyManager v2 lee el precio HBAR/USD desde un contrato que implementa la interfaz `AggregatorV3Interface` de Chainlink. El risk score se ajusta segun el valor real en USD de la transaccion.

**¿Qué es CRE?**
Chainlink Runtime Environment. Es el orchestration layer de Chainlink que permite correr logica en un DON (red descentralizada de nodos). En vez de que nuestro risk scoring corra en un servidor, corre en multiples nodos que llegan a consenso.

**¿Tienen simulacion exitosa?**
Si, corrimos `cre workflow simulate` y el resultado fue SUCCESS. El workflow fetcheo el precio real de HBAR ($0.087), evaluo 4 transacciones, y retorno 1 ALLOW, 2 WARN, 1 BLOCK.

**¿Hay state change on-chain?**
Si. La funcion `getVerdictWithPrice()` en PolicyManager v2 lee el precio del feed de Chainlink, ajusta el risk score, y emite un evento `PriceAwareVerdict`. Eso es un state change en blockchain.

**¿El Price Feed es real?**
En testnet usamos un MockPriceFeed que implementa la misma interfaz `AggregatorV3Interface` de Chainlink. En mainnet de Hedera, se conectaria al feed real de HBAR/USD en `0xAF685FB45C12b92b5054ccb9313e135525F9b5d5`.

**¿Qué es consensusIdenticalAggregation?**
Es la funcion del SDK de CRE que garantiza que todos los nodos del DON obtuvieron el mismo precio antes de continuar. Si un nodo ve un precio diferente, se descarta. Esto previene manipulacion.

---

## Ledger

**¿Cómo integran Ledger?**
Cuando el verdict es WARN (riesgo medio), el agente no puede mover fondos. Se muestra un modal en el frontend que requiere aprobacion humana. Si el usuario tiene un Ledger conectado, la transaccion se firma en el hardware device.

**¿Qué es Clear Signing?**
Es ERC-7730. En vez de mostrar datos hexadecimales en la pantalla del Ledger, mostramos informacion legible: "Register AI Agent", "Risk Score: 45/100", "Transfer 20 HBAR to 0x1234...". Tenemos JSON files para los 3 contratos.

**¿Por qué Ledger como trust layer?**
Porque el agente AI corre autonomo. Si algo tiene riesgo medio, necesitas un humano que valide. Y un humano firmando en un hardware wallet es el nivel mas alto de seguridad — las keys nunca salen del dispositivo.

---

## Tecnico

**¿Qué stack usan?**
- Frontend: Next.js 14, Tailwind CSS, wagmi v2, viem
- Contratos: Solidity 0.8.24, Foundry
- Agente: TypeScript con viem + Hedera Agent Kit
- Chainlink: CRE SDK (TypeScript), AggregatorV3Interface
- Chain: Hedera Testnet (Chain ID 296)

**¿Cuántos tests tienen?**
23 tests, todos passing. Cubren registro de agentes, politicas, verdicts, assessments, price feeds, y value adjustments.

**¿El frontend es funcional?**
Si, completamente. Podes:
- Registrar un agente on-chain
- Simular un assessment (calcula score, consulta PolicyManager on-chain)
- Ver el audit trail de assessments
- Configurar los umbrales de la politica
- Correr el CRE workflow y ver los resultados con precio live

**¿Cómo se ve la pagina de workflow?**
Tiene un boton "Run CRE Risk Assessment" que ejecuta la simulacion. Muestra precio HBAR live (leido del contrato on-chain), 4 transacciones evaluadas con sus scores y verdicts, estadisticas (total exposure, value blocked), y un badge que dice "Price from Chainlink AggregatorV3Interface on-chain".

---

## Bounties

**¿A qué bounties aplican?**

| Bounty | Monto | Cómo califican |
|--------|-------|----------------|
| Hedera — AI on Hedera | $2,000 | Agent Kit SDK, 3 contratos en Hedera EVM, HBAR transfers |
| Ledger — AI Agents x Clear Signing | $6,000 | Human-in-the-loop, Wallet Provider EIP-6963, ERC-7730 |
| Chainlink — Best CRE Workflow | $4,000 | CRE workflow con HTTP + DON consensus, simulacion exitosa |
| Chainlink — Connect the World | $1,000 | Price Feed AggregatorV3Interface, state change on-chain |

**¿Qué los diferencia de otros proyectos?**
La mayoria de proyectos de AI agents se enfocan en que el agente haga cosas. Nosotros nos enfocamos en que el agente **no haga cosas peligrosas**. Somos el firewall, no el motor. Y lo hacemos de forma descentralizada con Chainlink, verificable con Hedera, y segura con Ledger.
