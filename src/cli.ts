import yargs, { ArgumentsCamelCase } from "yargs";
import { hideBin } from "yargs/helpers";
import {
  blockUtils,
  blockchainUtils,
  transactionUtils,
  participantUtils,
} from "@xilution/todd-coin-utils";
import { ApiData } from "./types";
import axios, { AxiosResponse } from "axios";
import _ from "lodash";
import {
  DEFAULT_PAGE_SIZE,
  FIRST_PAGE,
  MAX_TRANSACTIONS_PER_BLOCK,
} from "@xilution/todd-coin-constants";
import {
  Block,
  BlockTransaction,
  Participant,
  PendingTransaction,
  SignedTransaction,
  TransactionDetails,
} from "@xilution/todd-coin-types";

const getBlockTransactions = async (
  baseUrl: string,
  blockData: ApiData<Block>
): Promise<BlockTransaction<TransactionDetails>[]> => {
  const transactionsResponse: AxiosResponse<{
    data: ApiData<BlockTransaction<TransactionDetails>>[];
  }> = await axios.get(
    `${baseUrl}/blocks/${blockData.id}/transactions?page[number]=${FIRST_PAGE}&page[size]=${MAX_TRANSACTIONS_PER_BLOCK}`
  );

  return transactionsResponse.data.data.map(
    (transactionData: ApiData<BlockTransaction<TransactionDetails>>) => ({
      id: transactionData.id,
      ...transactionData.attributes,
    })
  ) as BlockTransaction<TransactionDetails>[];
};

// todo - paginate blocks

const getBlocks = async (baseUrl: string): Promise<Block[]> => {
  const blocksResponse: AxiosResponse<{
    data: ApiData<Block>[];
  }> = await axios.get(
    `${baseUrl}/blocks?page[number]=0&page[size]=${DEFAULT_PAGE_SIZE}`
  );

  return (await Promise.all(
    blocksResponse.data.data.map(async (blockData: ApiData<Block>) => {
      const transactions: BlockTransaction<TransactionDetails>[] =
        await getBlockTransactions(baseUrl, blockData);

      return {
        ...blockData.attributes,
        id: blockData.id,
        transactions,
      };
    })
  )) as Block[];
};

const getParticipantById = async (
  baseUrl: string,
  participantId: string
): Promise<Participant> => {
  const participantResponse: AxiosResponse<{ data: ApiData<Participant> }> =
    await axios.get(`${baseUrl}/participants/${participantId}`);
  return {
    id: participantResponse.data.data.id,
    ...participantResponse.data.data.attributes,
  } as Participant;
};

const getSomeSignedTransactionsToMine = async (
  baseUrl: string
): Promise<SignedTransaction<TransactionDetails>[]> => {
  const signedTransactionsResponse: AxiosResponse<{
    data: ApiData<SignedTransaction<TransactionDetails>>[];
  }> = await axios.get(
    `${baseUrl}/signed-transactions?page[number]=0&page[size]=${DEFAULT_PAGE_SIZE}`
  );
  return signedTransactionsResponse.data.data.map(
    (data: ApiData<SignedTransaction<TransactionDetails>>) => ({
      id: data.id,
      ...data.attributes,
    })
  ) as SignedTransaction<TransactionDetails>[];
};

const getPendingTransactionById = async (
  baseUrl: string,
  pendingTransactionId: string
): Promise<PendingTransaction<TransactionDetails>> => {
  const pendingTransactionResponse: AxiosResponse<{
    data: ApiData<PendingTransaction<TransactionDetails>>;
  }> = await axios.get(
    `${baseUrl}/pending-transactions/${pendingTransactionId}`
  );
  return {
    id: pendingTransactionResponse.data.data.id,
    ...pendingTransactionResponse.data.data.attributes,
  };
};

// todo add authentication

// todo other operations...
// 1. add pending transaction
// 2. view my pending transactions for signing

export const cli = () =>
  yargs(hideBin(process.argv))
    .command(
      "sign-pending-transaction <baseUrl> <goodPoints> <privateKey> <pendingTransactionId>",
      "sign a pending todd-coin transaction",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{
          baseUrl: string;
          privateKey: string;
          pendingTransactionId: string;
        }>
      ) => {
        const baseUrl = args.baseUrl as string;
        const privateKey = args.privateKey as string;
        const goodPoints = args.goodPoints as number;
        const pendingTransactionId = args.pendingTransactionId as string;
        const pendingTransaction: PendingTransaction<TransactionDetails> =
          await getPendingTransactionById(baseUrl, pendingTransactionId);
        const signedTransaction: SignedTransaction<TransactionDetails> =
          transactionUtils.signTransaction(
            pendingTransaction,
            goodPoints,
            privateKey
          );

        console.log(JSON.stringify(signedTransaction, null, 2));
      }
    )
    .command(
      "mine <baseUrl>",
      "mine next todd-coin block",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{
          baseUrl: string;
        }>
      ) => {
        const baseUrl = args.baseUrl as string;
        const latestBlock: Block | undefined = _.last(await getBlocks(baseUrl)); // todo - this is super inefficient

        if (latestBlock === undefined) {
          console.log(
            "Unable to mine because, the latest block was not found."
          );
          return;
        }

        const signedTransactions: SignedTransaction<TransactionDetails>[] =
          await getSomeSignedTransactionsToMine(baseUrl);
        const newBlock: Block = blockUtils.mineNewBlock(
          latestBlock,
          signedTransactions
        );
        console.log(JSON.stringify(newBlock, null, 2));
      }
    )
    .command(
      "validate <baseUrl>",
      "validate todd-coin",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{
          baseUrl: string;
        }>
      ) => {
        const baseUrl = args.baseUrl as string;
        const blocks: Block[] = await getBlocks(baseUrl);
        const isValid: boolean = blockchainUtils.isChainValid(blocks);

        if (isValid) {
          // todo - save a validated page number, so you only have to validate a small portion of the chain
          console.log("Looks good!");
        } else {
          console.log("Something's not right.");
        }
      }
    )
    .command(
      "get-balance <baseUrl> <participantId>",
      "get todd-coin participant balance",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{ baseUrl: string; participantId: string }>
      ) => {
        const baseUrl = args.baseUrl as string;
        const participantId = args.participantId as string;
        const participant: Participant = await getParticipantById(
          baseUrl,
          participantId
        );
        const blocks: Block[] = await getBlocks(baseUrl);
        const balance: number = participantUtils.calculateAccumulatedGoodPoints(
          participant,
          blocks
        );

        console.log(`balance: ${balance}`);
      }
    )
    .demandCommand(1)
    .parse();
