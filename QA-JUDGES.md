# AegisPay — Q&A para Judges

Guia rapida de respuestas para preguntas tipicas de judges en ETHGlobal Cannes.

---

## General

**¿Qué es AegisPay?**
Es una trust layer para agentes AI autonomos. Antes de que un agente ejecute un pago, AegisPay evalua el riesgo (score 0-100), aplica una politica on-chain (ALLOW/WARN/BLOCK), y registra cada decision como audit trail inmutable.

**¿Qué problema resuelve?**
Los agentes AI pueden pagar APIs, servicios y herramientas sin intervencion humana. Pero si un agente intenta enviar fondos a una direccion sospechosa o hacer una transaccion de alto valor, no hay nada que lo detenga. AegisPay es ese freno inteligente.

**¿Cómo funciona el risk scoring? / How do you calculate the risk?**
Cada transaccion se evalua con 5 factores que suman puntos:

| Factor | Puntos | Ejemplo |
|--------|--------|---------|
| **Monto en USD** | +35 si >$1000, +15 si >$100, +5 si bajo | 50 HBAR × $0.087 = $4.35 → +5 |
| **Direccion destino** | +60 si es address riesgosa (burn, zero) | `0x...dead` → +60 |
| **Tipo de accion** | +15 contract-call, +10 swap, +10 mint, 0 transfer | Swap → +10 |
| **Primera interaccion** | +15 si nunca se interactuo con ese target | Siempre +15 en demo |
| **Base** | +10 siempre | Base risk |

El score se clampea entre 0-100. Despues el PolicyManager on-chain decide:
- Score < 30 → ALLOW (ej: transfer de 0.5 HBAR a address conocida = score ~15)
- Score 30-69 → WARN (ej: swap de 50 HBAR a address nueva = score ~45)
- Score >= 70 → BLOCK (ej: transfer a burn address = score ~85)

**Ejemplo concreto de la demo:**
- Transfer 0.5 HBAR a address normal: base(10) + low_value(5) + transfer(0) + first(15) = **30 → ALLOW** (justo en el limite)
- Swap 50 HBAR a address nueva: base(10) + low_value(5) + swap(10) + first(15) = **40 → WARN**
- Transfer 200 HBAR a 0x...dead: base(10) + risky(60) + low_value(5) + transfer(0) + first(15) = **90 → BLOCK**

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

**¿Qué les parecio Hedera? / What was your experience with Hedera?**
Muy buena. La compatibilidad EVM hace que deployar con Foundry sea igual que en Ethereum — mismo tooling, mismos ABIs. Los fees son practicamente gratis (~$0.001 por tx), lo cual es clave para nosotros porque un agente AI puede hacer decenas de assessments por hora. La finality de 3-5 segundos hace que la UX sea fluida. El JSON-RPC relay via hashio.io funciona sin problemas con wagmi/viem.

**¿Tuvieron problemas con la documentacion de Hedera?**
La documentacion del JSON-RPC relay y la parte EVM esta bien. Lo unico que nos costo un poco fue encontrar los endpoints correctos para testnet (`https://testnet.hashio.io/api`) y configurar el chain ID 296 en wagmi, pero una vez que lo encontramos fue plug and play. HashScan como explorer es muy claro para verificar contratos y transacciones.

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

## ENS

**¿Usan ENS?**
Si. El sidebar del frontend resuelve ENS names y avatares para la wallet conectada. Si tu address tiene un nombre .eth registrado, se muestra el nombre y la foto de perfil en vez del address crudo. Usamos los hooks `useEnsName` y `useEnsAvatar` de wagmi, resolviendo contra Ethereum mainnet.

**¿Por qué ENS si estan en Hedera?**
ENS es el estandar de identidad en el ecosistema EVM. Los agentes AI y sus operadores pueden tener nombres .eth. Mostrarlo en la UI hace que sea mas facil identificar quien esta operando — en vez de ver `0x5e07...e929` ves `alice.eth` con su avatar.

**¿Funciona con cualquier wallet?**
Si, si la address conectada tiene un ENS name registrado en mainnet, se resuelve automaticamente. Si no tiene, muestra el address normal.

---

## Ledger

**¿Cómo integran Ledger?**
Cuando el verdict es WARN (riesgo medio), el agente no puede mover fondos. Se muestra un modal en el frontend "Human Approval Required — Ledger Secure Flow" que requiere aprobacion humana. Si el usuario tiene un Ledger conectado, la transaccion se firma en el hardware device.

El flujo completo:
1. Agente quiere hacer un pago (ej: swap 50 HBAR)
2. Risk engine calcula score = 40 → WARN
3. Aparece modal con detalles: target, amount, action, risk score
4. El operador aprueba → la tx va al Ledger device
5. Ledger muestra Clear Signing (datos legibles, no hex)
6. Operador confirma en el device → assessment registrado on-chain
7. Si rechaza → transaccion cancelada, assessment igual se registra como rechazado

**¿Qué es Clear Signing / ERC-7730?**
Es un estandar para que el Ledger device muestre informacion legible en vez de datos hexadecimales. Tenemos 3 JSON files (uno por contrato) que mapean cada funcion a labels humanos:

| Contrato | Funciones | Lo que muestra el Ledger |
|----------|-----------|--------------------------|
| AgentRegistry | `registerAgent` | "Register AI Agent" + address + metadata URI |
| AgentRegistry | `toggleAgent` | "Toggle Agent Status" + active/inactive |
| PolicyManager | `setPolicy` | "Update Risk Policy" + low threshold + high threshold |
| AssessmentRegistry | `createAssessment` | "Record Assessment" + agent + target + Risk Score (0-100) + verdict |

Los archivos estan en `src/clear-signing/` y siguen el schema oficial `erc7730-v1.schema.json`.

**¿Por qué Ledger como trust layer?**
Porque el agente AI corre autonomo. Si algo tiene riesgo medio, necesitas un humano que valide. Y un humano firmando en un hardware wallet es el nivel mas alto de seguridad — las keys nunca salen del dispositivo. Es la diferencia entre "un popup de MetaMask que cualquier script puede aceptar" vs "un boton fisico que un humano tiene que apretar".

**¿Cómo detectan si es Ledger o MetaMask?**
Usamos `useConnectorClient` de wagmi. Si el transport es "Ledger" o el account source es "ledger", la UI cambia: el boton dice "Sign on Ledger device..." en vez de "Confirm in wallet..." y se activa el flujo de Clear Signing.

**¿Cómo se conecta un Ledger al frontend?**
Usamos `@ledgerhq/ledger-wallet-provider` via EIP-6963. Cuando Ledger Live esta abierto y el Ledger esta conectado por USB con la app Ethereum abierta, wagmi lo auto-detecta como wallet disponible. No hace falta configuracion extra.

**¿Se puede probar ahora con un Ledger?**
Si. Abrir Ledger Live → conectar device por USB → abrir app Ethereum → ir a la web → Connect Wallet (deberia aparecer Ledger como opcion) → ir a Simulate → hacer un caso WARN → el modal aparece → Approve → el Ledger device muestra los Clear Signing details → confirmar en el device.

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
