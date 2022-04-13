#!/usr/bin/env node

import yargs, { ArgumentsCamelCase } from "yargs";
import { hideBin } from "yargs/helpers";
import {
  blockUtils,
  blockchainUtils,
  transactionUtils,
} from "@xilution/todd-coin-utils";
import { ApiData, Block, Participant, Transaction } from "./types";
import axios, { AxiosResponse } from "axios";
import _ from "lodash";
import {
  DEFAULT_PAGE_SIZE,
  FIRST_PAGE,
  MAX_TRANSACTIONS_PER_BLOCK,
} from "@xilution/todd-coin-constants";

const getBlockTransactions = async (
  blockData: ApiData<Block>
): Promise<Transaction[]> => {
  const transactionsResponse: AxiosResponse<{
    data: ApiData<Transaction>[];
  }> = await axios.get(
    `http://localhost:3000/blocks/${blockData.id}/transactions?page[number]=${FIRST_PAGE}&page[size]=${MAX_TRANSACTIONS_PER_BLOCK}`
  );

  return transactionsResponse.data.data.map(
    (transactionData: ApiData<Transaction>) => ({
      id: transactionData.id,
      ...transactionData.attributes,
    })
  ) as Transaction[];
};

// todo - paginate blocks

const getBlocks = async (): Promise<Block[]> => {
  const blocksResponse: AxiosResponse<{
    data: ApiData<Block>[];
  }> = await axios.get(
    `http://localhost:3000/blocks?page[number]=0&page[size]=${DEFAULT_PAGE_SIZE}`
  );

  return (await Promise.all(
    blocksResponse.data.data.map(async (blockData: ApiData<Block>) => {
      const transactions = await getBlockTransactions(blockData);

      return {
        id: blockData.id,
        transactions,
        ...blockData.attributes,
      };
    })
  )) as Block[];
};

const getParticipantById = async (
  participantId: string
): Promise<Participant> => {
  const participantResponse: AxiosResponse<{ data: ApiData<Participant> }> =
    await axios.get(`http://localhost:3000/participants/${participantId}`);
  return {
    id: participantResponse.data.data.id,
    ...participantResponse.data.data.attributes,
  } as Participant;
};

const getSomeSignedTransactionsToMine = async (): Promise<Transaction[]> => {
  const signedTransactionsResponse: AxiosResponse<{
    data: ApiData<Transaction>[];
  }> = await axios.get(
    `http://localhost:3000/signed-transactions?page[number]=0&page[size]=${MAX_TRANSACTIONS_PER_BLOCK}`
  );
  return signedTransactionsResponse.data.data.map(
    (data: ApiData<Transaction>) => ({
      id: data.id,
      ...data.attributes,
    })
  ) as Transaction[];
};

const getPendingTransactionById = async (
  pendingTransactionId: string
): Promise<Transaction> => {
  const pendingTransactionResponse = await axios.get(
    `http://localhost:3000/pending-transactions/${pendingTransactionId}`
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

// todo make the host a variable

yargs(hideBin(process.argv))
  .command(
    "sign-pending-transaction <privateKey> <pendingTransactionId>",
    "sign a pending todd-coin transaction",
    () => {},
    async (
      args: ArgumentsCamelCase<{
        privateKey: string;
        pendingTransactionId: string;
      }>
    ) => {
      const privateKey = args.privateKey as string;
      const pendingTransactionId = args.pendingTransactionId as string;
      const pendingTransaction: Transaction = await getPendingTransactionById(
        pendingTransactionId
      );
      const signedTransaction: Transaction = transactionUtils.signTransaction(
        pendingTransaction,
        privateKey
      );

      console.log(JSON.stringify(signedTransaction, null, 2));
    }
  )
  .command(
    "mine",
    "mine next todd-coin block",
    () => {},
    async () => {
      const latestBlock: Block = _.last(await getBlocks());
      const signedTransactions: Transaction[] =
        await getSomeSignedTransactionsToMine();
      const newBlock: Block = blockUtils.mineNextBlock(
        latestBlock,
        new Date().toISOString(),
        signedTransactions
      );

      console.log(JSON.stringify(newBlock, null, 2));
    }
  )
  .command(
    "validate",
    "validate todd-coin",
    () => {},
    async () => {
      const blocks: Block[] = await getBlocks();
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
    "get-balance <participantId>",
    "get todd-coin participant balance",
    () => {},
    async (args: ArgumentsCamelCase<{ participantId: string }>) => {
      const participantId = args.participantId as string;
      const participant: Participant = await getParticipantById(participantId);
      const blocks: Block[] = await getBlocks();
      const balance: number = blockchainUtils.getParticipantBalance(
        blocks,
        participant.key.public
      );

      console.log(`balance: ${balance}`);
    }
  )
  .demandCommand(1)
  .parse();
