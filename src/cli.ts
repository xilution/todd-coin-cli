import yargs, { ArgumentsCamelCase } from "yargs";
import { hideBin } from "yargs/helpers";
import {
  blockchainUtils,
  transactionUtils,
  participantUtils,
  keyUtils,
} from "@xilution/todd-coin-utils";
import { ApiData } from "./types";
import axios, { AxiosError, AxiosResponse } from "axios";
import { DEFAULT_PAGE_SIZE, FIRST_PAGE } from "@xilution/todd-coin-constants";
import {
  Block,
  BlockTransaction,
  Participant,
  ParticipantKey,
  PendingTransaction,
  SignedTransaction,
  TransactionDetails,
} from "@xilution/todd-coin-types";

type AccessToken = { access: string };

const getAccessToken = async (
  baseUrl: string,
  email: string,
  password: string
): Promise<AccessToken> => {
  const transactionsResponse: AxiosResponse<AccessToken> = await axios.post(
    `${baseUrl}/auth/token`,
    {
      email,
      password,
    },
    {}
  );

  return transactionsResponse.data;
};

const getBlockTransactions = async (
  baseUrl: string,
  accessToken: string,
  blockId: string,
  startingPage: number = FIRST_PAGE
): Promise<BlockTransaction<TransactionDetails>[]> => {
  let blockTransactions: BlockTransaction<TransactionDetails>[] = [];
  let nextUrl:
    | string
    | undefined = `${baseUrl}/blocks/${blockId}/transactions?page[number]=${startingPage}&page[size]=${DEFAULT_PAGE_SIZE}`;

  while (nextUrl) {
    const response: AxiosResponse<{
      data: ApiData<BlockTransaction<TransactionDetails>>[];
      links: {
        next: string;
      };
    }> = await axios.get(nextUrl, {
      headers: {
        authorization: `bearer ${accessToken}`,
      },
    });

    const someTransactions = response.data.data.map(
      (transactionData: ApiData<BlockTransaction<TransactionDetails>>) => ({
        id: transactionData.id,
        ...transactionData.attributes,
      })
    ) as BlockTransaction<TransactionDetails>[];

    blockTransactions = blockTransactions.concat(someTransactions);

    if (response.data.data.length > 0) {
      nextUrl = response.data.links.next;
    } else {
      nextUrl = undefined;
    }
  }

  return blockTransactions;
};

const getBlocks = async (
  baseUrl: string,
  accessToken: string,
  startingPage: number = FIRST_PAGE
): Promise<Block[]> => {
  let blocks: Block[] = [];
  let nextUrl:
    | string
    | undefined = `${baseUrl}/blocks?page[number]=${startingPage}&page[size]=${DEFAULT_PAGE_SIZE}`;

  while (nextUrl) {
    const response: AxiosResponse<{
      data: ApiData<Block>[];
      links: {
        next: string;
      };
    }> = await axios.get(nextUrl, {
      headers: {
        authorization: `bearer ${accessToken}`,
      },
    });

    const someBlocks = (await Promise.all(
      response.data.data.map(async (blockData: ApiData<Block>) => {
        const transactions: BlockTransaction<TransactionDetails>[] =
          await getBlockTransactions(baseUrl, accessToken, blockData.id);

        return {
          ...blockData.attributes,
          id: blockData.id,
          transactions,
        };
      })
    )) as Block[];

    blocks = blocks.concat(someBlocks);

    if (response.data.data.length > 0) {
      nextUrl = response.data.links.next;
    } else {
      nextUrl = undefined;
    }
  }

  return blocks;
};

const createParticipant = async (
  baseUrl: string,
  email: string,
  password: string
): Promise<Participant> => {
  const response: AxiosResponse<{ data: ApiData<Participant> }> =
    await axios.post(
      `${baseUrl}/participants`,
      {
        data: {
          type: "participant",
          attributes: {
            email,
            password,
            roles: ["VOLUNTEER"],
          },
        },
      },
      {}
    );

  return {
    id: response.data.data.id,
    ...response.data.data.attributes,
  } as Participant;
};

const getParticipantById = async (
  baseUrl: string,
  accessToken: string,
  participantId: string
): Promise<Participant> => {
  const response: AxiosResponse<{ data: ApiData<Participant> }> =
    await axios.get(`${baseUrl}/participants/${participantId}`, {
      headers: {
        authorization: `bearer ${accessToken}`,
      },
    });

  return {
    id: response.data.data.id,
    ...response.data.data.attributes,
  } as Participant;
};

const getParticipantKeyById = async (
  baseUrl: string,
  accessToken: string,
  participantId: string,
  participantKeyId: string
): Promise<ParticipantKey> => {
  const response: AxiosResponse<{ data: ApiData<ParticipantKey> }> =
    await axios.get(
      `${baseUrl}/participants/${participantId}/keys/${participantKeyId}`,
      {
        headers: {
          authorization: `bearer ${accessToken}`,
        },
      }
    );

  return {
    id: response.data.data.id,
    ...response.data.data.attributes,
  } as ParticipantKey;
};

const createParticipantKey = async (
  baseUrl: string,
  accessToken: string,
  participant: Participant,
  publicKey: string,
  privateKey: string,
  effectiveFrom: string,
  effectiveTo: string
): Promise<ParticipantKey> => {
  const response: AxiosResponse<{ data: ApiData<ParticipantKey> }> =
    await axios.post(
      `${baseUrl}/participants/${participant.id}/keys`,
      {
        data: {
          type: "participant-key",
          attributes: {
            public: publicKey,
            private: privateKey,
            effective: {
              from: effectiveFrom,
              to: effectiveTo,
            },
          },
        },
      },
      {
        headers: {
          authorization: `bearer ${accessToken}`,
        },
      }
    );

  return {
    id: response.data.data.id,
    ...response.data.data.attributes,
  } as ParticipantKey;
};

const createPendingTransaction = async (
  baseUrl: string,
  accessToken: string,
  description: string,
  fromParticipantId: string,
  toParticipantId: string,
  fromTime: string,
  toTime: string
): Promise<PendingTransaction<TransactionDetails>> => {
  const response: AxiosResponse<{
    data: ApiData<PendingTransaction<TransactionDetails>>;
  }> = await axios.post(
    `${baseUrl}/pending-transactions`,
    {
      data: {
        type: "pending-transaction",
        attributes: {
          description,
          type: "TIME",
          details: {
            dateRanges: [
              {
                from: fromTime,
                to: toTime,
              },
            ],
          },
        },
        relationships: {
          from: {
            data: {
              type: "participant",
              id: fromParticipantId,
            },
          },
          to: {
            data: {
              type: "participant",
              id: toParticipantId,
            },
          },
        },
      },
    },
    {
      headers: {
        authorization: `bearer ${accessToken}`,
      },
    }
  );

  return {
    id: response.data.data.id,
    ...response.data.data.attributes,
  } as PendingTransaction<TransactionDetails>;
};

const getPendingTransactionById = async (
  baseUrl: string,
  accessToken: string,
  pendingTransactionId: string
): Promise<PendingTransaction<TransactionDetails>> => {
  const response: AxiosResponse<{
    data: ApiData<PendingTransaction<TransactionDetails>>;
  }> = await axios.get(
    `${baseUrl}/pending-transactions/${pendingTransactionId}`,
    {
      headers: {
        authorization: `bearer ${accessToken}`,
      },
    }
  );

  const fromParticipant: Participant = await getParticipantById(
    baseUrl,
    accessToken,
    (response.data.data.relationships.from.data as ApiData<Participant>).id
  );

  const toParticipant: Participant = await getParticipantById(
    baseUrl,
    accessToken,
    (response.data.data.relationships.to.data as ApiData<Participant>).id
  );

  return {
    id: response.data.data.id,
    ...response.data.data.attributes,
    fromParticipant,
    toParticipant,
  };
};

const createSignedTransaction = async (
  baseUrl: string,
  accessToken: string,
  signedTransaction: SignedTransaction<TransactionDetails>
): Promise<SignedTransaction<TransactionDetails>> => {
  const response: AxiosResponse<{
    data: ApiData<SignedTransaction<TransactionDetails>>;
  }> = await axios.post(
    `${baseUrl}/signed-transactions`,
    {
      data: {
        type: "signed-transaction",
        id: signedTransaction.id,
        attributes: {
          goodPoints: signedTransaction.goodPoints,
          signature: signedTransaction.signature,
          description: signedTransaction.description,
          type: signedTransaction.type,
          details: signedTransaction.details,
        },
        relationships: {
          from: {
            data: {
              type: "participant",
              id: signedTransaction.fromParticipant?.id,
            },
          },
          to: {
            data: {
              type: "participant",
              id: signedTransaction.toParticipant?.id,
            },
          },
        },
      },
    },
    {
      headers: {
        authorization: `bearer ${accessToken}`,
      },
    }
  );

  return {
    id: response.data.data.id,
    ...response.data.data.attributes,
  } as SignedTransaction<TransactionDetails>;
};

export const cli = () =>
  yargs(hideBin(process.argv))
    .command(
      "create-participant <baseUrl> <email> <password>",
      "create a todd-coin participant",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{
          baseUrl: string;
          email: string;
          password: string;
        }>
      ) => {
        try {
          const baseUrl = args.baseUrl as string;
          const email = args.email as string;
          const password = args.password as string;

          const participant: Participant = await createParticipant(
            baseUrl,
            email,
            password
          );
          const accessToken: AccessToken = await getAccessToken(
            baseUrl,
            email,
            password
          );
          const participantKey: ParticipantKey =
            keyUtils.generateParticipantKey();
          await createParticipantKey(
            baseUrl,
            accessToken.access,
            participant,
            participantKey.public,
            participantKey.private as string,
            participantKey.effective.from,
            participantKey.effective.to
          );

          console.log(
            JSON.stringify(
              {
                ...participant,
                keys: [participantKey],
              },
              null,
              2
            )
          );
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error((error as AxiosError).response?.data);
          } else {
            console.error((error as Error).message);
          }
        }
      }
    )
    .command(
      "get-access-token <baseUrl> <email> <password>",
      "get a todd-coin access token",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{
          baseUrl: string;
          email: string;
          password: string;
        }>
      ) => {
        try {
          const baseUrl = args.baseUrl as string;
          const email = args.email as string;
          const password = args.password as string;
          const accessToken: AccessToken = await getAccessToken(
            baseUrl,
            email,
            password
          );

          console.log(JSON.stringify(accessToken, null, 2));
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error((error as AxiosError).response?.data);
          } else {
            console.error((error as Error).message);
          }
        }
      }
    )
    .command(
      "generate-key",
      "generate a todd-coin participant key",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async () => {
        try {
          const participantKey: ParticipantKey =
            keyUtils.generateParticipantKey();

          console.log(JSON.stringify(participantKey, null, 2));
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error((error as AxiosError).response?.data);
          } else {
            console.error((error as Error).message);
          }
        }
      }
    )
    .command(
      "create-pending-transaction <baseUrl> <accessToken> <description> <fromParticipantId> <toParticipantId> <fromTime> <toTime>",
      "create a pending todd-coin transaction",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{
          baseUrl: string;
          accessToken: string;
          description: string;
          fromParticipantId: string;
          toParticipantId: string;
          fromTime: string;
          toTime: string;
        }>
      ) => {
        try {
          const baseUrl = args.baseUrl as string;
          const accessToken = args.accessToken as string;
          const description = args.description as string;
          const fromParticipantId = args.fromParticipantId as string;
          const toParticipantId = args.toParticipantId as string;
          const fromTime = args.fromTime as string;
          const toTime = args.toTime as string;

          const pendingTransaction: PendingTransaction<TransactionDetails> =
            await createPendingTransaction(
              baseUrl,
              accessToken,
              description,
              fromParticipantId,
              toParticipantId,
              fromTime,
              toTime
            );

          console.log(JSON.stringify(pendingTransaction, null, 2));
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error((error as AxiosError).response?.data);
          } else {
            console.error((error as Error).message);
          }
        }
      }
    )
    .command(
      "sign-pending-transaction <baseUrl> <accessToken> <goodPoints> <participantId> <participantKeyId> <privateKey> <pendingTransactionId>",
      "sign a pending todd-coin transaction",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{
          baseUrl: string;
          accessToken: string;
          participantKeyId: string;
          privateKey: string;
          pendingTransactionId: string;
        }>
      ) => {
        try {
          const baseUrl = args.baseUrl as string;
          const accessToken = args.accessToken as string;
          const participantId = args.participantId as string;
          const participantKeyId = args.participantKeyId as string;
          const privateKey = args.privateKey as string;
          const goodPoints = args.goodPoints as number;
          const pendingTransactionId = args.pendingTransactionId as string;

          const pendingTransaction: PendingTransaction<TransactionDetails> =
            await getPendingTransactionById(
              baseUrl,
              accessToken,
              pendingTransactionId
            );

          const participant: Participant = await getParticipantById(
            baseUrl,
            accessToken,
            participantId
          );

          const participantKey: ParticipantKey = await getParticipantKeyById(
            baseUrl,
            accessToken,
            participant.id as string,
            participantKeyId
          );

          const signedTransaction: SignedTransaction<TransactionDetails> =
            transactionUtils.signTransaction(
              pendingTransaction,
              goodPoints,
              participantKey,
              privateKey
            );

          const createdSignedTransaction: SignedTransaction<TransactionDetails> =
            await createSignedTransaction(
              baseUrl,
              accessToken,
              signedTransaction
            );

          console.log(JSON.stringify(createdSignedTransaction, null, 2));
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error((error as AxiosError).response?.data);
          } else {
            console.error((error as Error).message);
          }
        }
      }
    )
    .command(
      "validate <baseUrl> <accessToken>",
      "validate todd-coin",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{
          baseUrl: string;
          accessToken: string;
        }>
      ) => {
        try {
          const baseUrl = args.baseUrl as string;
          const accessToken = args.accessToken as string;
          const blocks: Block[] = await getBlocks(baseUrl, accessToken);
          const isValid: boolean = blockchainUtils.isChainValid(blocks);

          if (isValid) {
            // todo - save a validated page number, so you only have to validate a small portion of the chain
            console.log("Looks good!");
          } else {
            console.log("Something's not right.");
          }
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error((error as AxiosError).response?.data);
          } else {
            console.error((error as Error).message);
          }
        }
      }
    )
    .command(
      "get-balance <baseUrl> <accessToken> <participantId>",
      "get todd-coin participant balance",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{
          baseUrl: string;
          accessToken: string;
          participantId: string;
        }>
      ) => {
        try {
          const baseUrl = args.baseUrl as string;
          const accessToken = args.accessToken as string;
          const participantId = args.participantId as string;
          const participant: Participant = await getParticipantById(
            baseUrl,
            accessToken,
            participantId
          );
          const blocks: Block[] = await getBlocks(baseUrl, accessToken);
          const balance: number =
            participantUtils.calculateAccumulatedGoodPoints(
              participant,
              blocks
            );

          console.log(`balance: ${balance}`);
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error((error as AxiosError).response?.data);
          } else {
            console.error((error as Error).message);
          }
        }
      }
    )
    .parse();
