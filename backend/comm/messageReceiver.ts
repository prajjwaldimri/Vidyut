import chalk from "chalk";
import { Socket } from "net";

import { Message, MessageSender, MessageType, Peer } from ".";
import { Block } from "../block";
import { BlockBodyContract } from "../block/blockBody";
import { Chain, Validator } from "../chain";
import db from "../db";
import { hasher, hashBlockBodyContract, hashValidator } from "../util/hasher";
import Wallet from "../wallet";
import bus from "../eventBus";

let seq = 0;

export default class MessageReceiver {
  constructor(
    public peers: { string: Peer } | {},
    private myId: string,
    private chain: Chain,
    private wallet: Wallet,
    private messageSender: MessageSender
  ) {}

  async process(message: Message, socket?: Socket) {
    switch (message.type) {
      case MessageType.TESTING:
        console.log("Message: ", message.data);
        break;

      case MessageType.HANDSHAKE:
        let data = JSON.parse(message.data);
        if (!this.peers[message.from])
          this.peers[message.from] = {
            seq,
            port: data.localPort,
            host: data.localAddress,
            publicKey: data.publicKey,
            socket: socket,
          };
        seq++;
        break;

      case MessageType.BLOCK_ADDITION_CONTRACT_UNVALIDATED:
        data = JSON.parse(message.data);
        const validatedBlock = this.chain.validateBlock(this.wallet, data);

        if (validatedBlock) {
          this.messageSender.broadcast(
            MessageType.BLOCK_ADDITION_CONTRACT,
            JSON.stringify(validatedBlock)
          );
          this.chain.addBlock(validatedBlock);
          await db.put("blocks", JSON.stringify(this.chain.blocks));
          console.log(
            chalk.green(
              `Contract block #${
                validatedBlock.index
              } validated at ${Date.now()}`
            )
          );
        } else {
          console.log(
            chalk.red(`Contract Block not validated at ${Date.now()}`)
          );
        }

        break;

      case MessageType.BLOCK_ADDITION_CONTRACT:
        const contractBlock = JSON.parse(message.data) as Block;
        this.chain.addBlock(contractBlock);
        await db.put("blocks", JSON.stringify(this.chain.blocks));
        console.log(
          chalk.green(`Block #${contractBlock.index} added at ${Date.now()}`)
        );
        break;

      case MessageType.BLOCK_ADDITION_REPUTATION:
        const reputationBlock = JSON.parse(message.data) as Block;
        this.chain.addBlock(reputationBlock);
        await db.put("blocks", JSON.stringify(this.chain.blocks));
        console.log(
          chalk.green(
            `Reputation block #${reputationBlock.index} added at ${Date.now()}`
          )
        );
        break;

      // Adds a validator to local chain
      case MessageType.VALIDATOR_ADDITION:
        const validator = JSON.parse(message.data) as Validator;
        this.chain.addValidator(validator);
        await db.put("validators", JSON.stringify(this.chain.validators));
        console.log(chalk.green(`Validator added at ${Date.now()}`));
        break;

      // Approving a validator
      case MessageType.VALIDATOR_APPROVAL:
        data = JSON.parse(message.data);

        // Simulates a real working 3rd party API like UIDAI
        setTimeout(async () => {
          const isValidatorAccepted = !Math.round(Math.random());

          if (isValidatorAccepted) {
            const validator = new Validator(
              message.from,
              this.wallet.publicKey,
              "",
              0,
              Math.floor(Math.random() * 20 * 100) / 100,
              Math.floor(Math.random() * 10 * 100) / 100,
              ""
            );
            const sign = this.wallet.sign(hashValidator(validator));

            validator.hash = hasher(JSON.stringify(validator));
            validator.approvedBySign = sign;

            this.chain.addValidator(validator);
            await db.put("validators", JSON.stringify(this.chain.validators));
            this.messageSender.broadcast(
              MessageType.VALIDATOR_ADDITION,
              JSON.stringify(validator)
            );
            console.log(chalk.green(`Validator approved at ${Date.now()}`));
          } else {
            this.messageSender.sendMessageToPeer(
              message.from,
              MessageType.TESTING,
              "Rejected"
            );
          }
        }, Math.floor(Math.random() * 1000));
        break;

      case MessageType.BUY_ELECTRICITY:
        let contract = JSON.parse(message.data) as BlockBodyContract;

        let currentValidator: Validator | null = null;

        for (const validator of this.chain.validators) {
          if (validator.address === this.myId) {
            currentValidator = validator;
            break;
          }
        }

        // Check if we can supply the current requested amount on the requested rate
        if (!currentValidator) {
          console.log("Not a validator");
          return;
        }

        if (
          currentValidator.energyCapacity <= contract.amount ||
          currentValidator.energyRate > contract.rate
        ) {
          console.log("Rate or capacity less");
          return;
        }

        // Check if the sign of consumer is valid
        if (
          !Wallet.isSignatureValid(
            message.from,
            contract.consumerSign,
            hashBlockBodyContract(contract)
          )
        ) {
          console.log("Signature of consumer not valid");
          return;
        }

        contract.producerSign = this.wallet.sign(
          hashBlockBodyContract(contract)
        );

        // Broadcast the block
        this.messageSender.broadcast(
          MessageType.BLOCK_ADDITION_CONTRACT_UNVALIDATED,
          JSON.stringify(
            Block.createContractBlock(
              this.chain.blocks[this.chain.blocks.length - 1],
              contract,
              this.wallet
            )
          )
        );
        console.log(
          chalk.green(`Contract block generated by producer at ${Date.now()}`)
        );
        break;

      case MessageType.SYNC_REQUEST:
        this.messageSender.sendMessageToPeer(
          message.from,
          MessageType.SYNC_RESPONSE,
          JSON.stringify(this.chain)
        );
        console.log(chalk.green(`Sync request received at ${Date.now()}`));
        break;

      case MessageType.SYNC_RESPONSE:
        this.chain.replaceChain(JSON.parse(message.data) as Chain);
        console.log(chalk.green(`Sync request completed at ${Date.now()}`));
        bus.emit("SyncComplete");
        break;

      default:
        console.log("Message: ", message.data);
        break;
    }
  }
}
