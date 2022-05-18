import yargs, { ArgumentsCamelCase } from "yargs";
import { hideBin } from "yargs/helpers";
import {
  blockchainUtils,
  keyUtils,
  participantUtils,
  transactionUtils,
} from "@xilution/todd-coin-utils";
import { ApiData } from "./types";
import axios, { AxiosError, AxiosResponse } from "axios";
import { DEFAULT_PAGE_SIZE, FIRST_PAGE } from "@xilution/todd-coin-constants";
import {
  Block,
  BlockTransaction,
  Organization,
  Participant,
  ParticipantKey,
  PendingTransaction,
  SignedTransaction,
  TransactionDetails,
  TransactionType,
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
    }> = await axios.get(nextUrl);

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
    }> = await axios.get(nextUrl);

    const someBlocks = (await Promise.all(
      response.data.data.map(async (blockData: ApiData<Block>) => {
        const transactions: BlockTransaction<TransactionDetails>[] =
          await getBlockTransactions(baseUrl, blockData.id);

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

const createOrganization = async (
  baseUrl: string,
  accessToken: string,
  name: string
): Promise<Organization> => {
  const response: AxiosResponse<{ data: ApiData<Organization> }> =
    await axios.post(
      `${baseUrl}/organizations`,
      {
        data: {
          type: "organization",
          attributes: {
            name,
            roles: ["CHARITY"],
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
  } as Organization;
};

const createOrganizationParticipantReference = async (
  baseUrl: string,
  accessToken: string,
  organizationId: string,
  participantId: string
): Promise<void> => {
  await axios.post(
    `${baseUrl}/organizations/${organizationId}/relationships/participants`,
    {
      data: [
        {
          type: "participant",
          id: participantId,
        },
      ],
    },
    {
      headers: {
        authorization: `bearer ${accessToken}`,
      },
    }
  );
};

const createOrganizationAuthorizedSignerReference = async (
  baseUrl: string,
  accessToken: string,
  organizationId: string,
  authorizedSignerId: string
): Promise<void> => {
  await axios.post(
    `${baseUrl}/organizations/${organizationId}/relationships/authorized-signers`,
    {
      data: [
        {
          type: "participant",
          id: authorizedSignerId,
        },
      ],
    },
    {
      headers: {
        authorization: `bearer ${accessToken}`,
      },
    }
  );
};

const createOrganizationAdministratorReference = async (
  baseUrl: string,
  accessToken: string,
  organizationId: string,
  administratorId: string
): Promise<void> => {
  await axios.post(
    `${baseUrl}/organizations/${organizationId}/relationships/administrators`,
    {
      data: [
        {
          type: "participant",
          id: administratorId,
        },
      ],
    },
    {
      headers: {
        authorization: `bearer ${accessToken}`,
      },
    }
  );
};

const getParticipantById = async (
  baseUrl: string,
  participantId: string
): Promise<Participant> => {
  const response: AxiosResponse<{ data: ApiData<Participant> }> =
    await axios.get(`${baseUrl}/participants/${participantId}`);

  return {
    id: response.data.data.id,
    ...response.data.data.attributes,
  } as Participant;
};

const getOrganizationById = async (
  baseUrl: string,
  organizationId: string
): Promise<Organization> => {
  const response: AxiosResponse<{ data: ApiData<Organization> }> =
    await axios.get(`${baseUrl}/organizations/${organizationId}`);

  return {
    id: response.data.data.id,
    ...response.data.data.attributes,
  } as Organization;
};

const getParticipantKeyById = async (
  baseUrl: string,
  participantId: string,
  participantKeyId: string
): Promise<ParticipantKey> => {
  const response: AxiosResponse<{ data: ApiData<ParticipantKey> }> =
    await axios.get(
      `${baseUrl}/participants/${participantId}/keys/${participantKeyId}`
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
  participantKey: ParticipantKey
): Promise<ParticipantKey> => {
  const { id, ...attributes } = participantKey;
  const response: AxiosResponse<{ data: ApiData<ParticipantKey> }> =
    await axios.post(
      `${baseUrl}/participants/${participant.id}/keys`,
      {
        data: {
          id,
          type: "participant-key",
          attributes,
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
  pendingTransaction: PendingTransaction<TransactionDetails>
): Promise<PendingTransaction<TransactionDetails>> => {
  const {
    id,
    fromParticipant,
    fromOrganization,
    toParticipant,
    toOrganization,
    ...attributes
  } = pendingTransaction;
  const data = {
    data: {
      id,
      type: "pending-transaction",
      attributes,
      relationships: {
        fromParticipant: fromParticipant
          ? {
              data: {
                type: "participant",
                id: fromParticipant.id,
              },
            }
          : undefined,
        fromOrganization: fromOrganization
          ? {
              data: {
                type: "organization",
                id: fromOrganization.id,
              },
            }
          : undefined,
        toParticipant: toParticipant
          ? {
              data: {
                type: "participant",
                id: toParticipant.id,
              },
            }
          : undefined,
        toOrganization: toOrganization
          ? {
              data: {
                type: "organization",
                id: toOrganization.id,
              },
            }
          : undefined,
      },
    },
  };
  const response: AxiosResponse<{
    data: ApiData<PendingTransaction<TransactionDetails>>;
  }> = await axios.post(`${baseUrl}/pending-transactions`, data, {
    headers: {
      authorization: `bearer ${accessToken}`,
    },
  });

  return {
    id: response.data.data.id,
    ...response.data.data.attributes,
  } as PendingTransaction<TransactionDetails>;
};

const getPendingTransactionById = async (
  baseUrl: string,
  pendingTransactionId: string
): Promise<PendingTransaction<TransactionDetails>> => {
  const response: AxiosResponse<{
    data: ApiData<PendingTransaction<TransactionDetails>>;
  }> = await axios.get(
    `${baseUrl}/pending-transactions/${pendingTransactionId}`
  );

  const fromParticipantId = (
    response.data.data.relationships.fromParticipant
      ?.data as ApiData<Participant>
  )?.id;

  let fromParticipant: Participant | undefined;

  if (fromParticipantId) {
    fromParticipant = await getParticipantById(baseUrl, fromParticipantId);
  }

  const fromOrganizationId = (
    response.data.data.relationships.fromOrganization
      ?.data as ApiData<Organization>
  )?.id;

  let fromOrganization: Organization | undefined;

  if (fromOrganizationId) {
    fromOrganization = await getOrganizationById(baseUrl, fromOrganizationId);
  }

  const toParticipantId = (
    response.data.data.relationships.toParticipant?.data as ApiData<Participant>
  )?.id;

  let toParticipant: Participant | undefined;

  if (toParticipantId) {
    toParticipant = await getParticipantById(baseUrl, toParticipantId);
  }

  const toOrganizationId = (
    response.data.data.relationships.toOrganization
      ?.data as ApiData<Organization>
  )?.id;

  let toOrganization: Organization | undefined;

  if (toOrganizationId) {
    toOrganization = await getOrganizationById(baseUrl, toOrganizationId);
  }

  return {
    id: response.data.data.id,
    ...response.data.data.attributes,
    fromParticipant,
    fromOrganization,
    toParticipant,
    toOrganization,
  };
};

const getSignedTransactionById = async (
  baseUrl: string,
  signedTransactionId: string
): Promise<SignedTransaction<TransactionDetails>> => {
  const response: AxiosResponse<{
    data: ApiData<SignedTransaction<TransactionDetails>>;
  }> = await axios.get(`${baseUrl}/signed-transactions/${signedTransactionId}`);

  const fromParticipantId = (
    response.data.data.relationships.fromParticipant
      ?.data as ApiData<Participant>
  )?.id;

  let fromParticipant: Participant | undefined;

  if (fromParticipantId) {
    fromParticipant = await getParticipantById(baseUrl, fromParticipantId);
  }

  const fromOrganizationId = (
    response.data.data.relationships.fromOrganization
      ?.data as ApiData<Organization>
  )?.id;

  let fromOrganization: Organization | undefined;

  if (fromOrganizationId) {
    fromOrganization = await getOrganizationById(baseUrl, fromOrganizationId);
  }

  const toParticipantId = (
    response.data.data.relationships.toParticipant?.data as ApiData<Participant>
  )?.id;

  let toParticipant: Participant | undefined;

  if (toParticipantId) {
    toParticipant = await getParticipantById(baseUrl, toParticipantId);
  }

  const toOrganizationId = (
    response.data.data.relationships.toOrganization
      ?.data as ApiData<Organization>
  )?.id;

  let toOrganization: Organization | undefined;

  if (toOrganizationId) {
    toOrganization = await getOrganizationById(baseUrl, toOrganizationId);
  }

  return {
    id: response.data.data.id,
    ...response.data.data.attributes,
    fromParticipant,
    fromOrganization,
    toParticipant,
    toOrganization,
  };
};

const createSignedTransaction = async (
  baseUrl: string,
  accessToken: string,
  signedTransaction: SignedTransaction<TransactionDetails>
): Promise<SignedTransaction<TransactionDetails>> => {
  const { id, participantKey, goodPoints, signature } = signedTransaction;

  const data = {
    data: {
      id,
      type: "signed-transaction",
      attributes: {
        goodPoints,
        signature,
      },
      relationships: {
        participantKey: {
          data: {
            type: "participant-key",
            id: participantKey?.id,
          },
        },
      },
    },
  };
  const response: AxiosResponse<{
    data: ApiData<SignedTransaction<TransactionDetails>>;
  }> = await axios.post(`${baseUrl}/signed-transactions`, data, {
    headers: {
      authorization: `bearer ${accessToken}`,
    },
  });

  return {
    id: response.data.data.id,
    ...response.data.data.attributes,
  } as SignedTransaction<TransactionDetails>;
};

const updateSignedTransaction = async (
  baseUrl: string,
  accessToken: string,
  signedTransaction: SignedTransaction<TransactionDetails>
): Promise<void> => {
  const { id, participantKey, goodPoints, signature } = signedTransaction;

  const data = {
    data: {
      id,
      type: "signed-transaction",
      attributes: {
        goodPoints,
        signature,
      },
      relationships: {
        participantKey: {
          data: {
            type: "participant-key",
            id: participantKey?.id,
          },
        },
      },
    },
  };
  await axios.patch(`${baseUrl}/signed-transactions/${id}`, data, {
    headers: {
      authorization: `bearer ${accessToken}`,
    },
  });
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

          const createdParticipant: Participant = await createParticipant(
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
          const createdParticipantKey: ParticipantKey =
            await createParticipantKey(
              baseUrl,
              accessToken.access,
              createdParticipant,
              {
                public: participantKey.public,
                private: participantKey.private as string,
                effective: {
                  from: participantKey.effective.from,
                  to: participantKey.effective.to,
                },
              }
            );

          console.log(
            JSON.stringify(
              {
                ...createdParticipant,
                keys: [
                  { ...createdParticipantKey, private: participantKey.private },
                ],
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
      "create-organization <baseUrl> <accessToken> <name>",
      "create a todd-coin organization",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{
          baseUrl: string;
          accessToken: string;
          name: string;
        }>
      ) => {
        try {
          const baseUrl = args.baseUrl as string;
          const accessToken = args.accessToken as string;
          const name = args.name as string;

          const organization: Organization = await createOrganization(
            baseUrl,
            accessToken,
            name
          );

          console.log(JSON.stringify(organization, null, 2));
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
      "add-participant-to-organization <baseUrl> <accessToken> <participantId> <organizationId>",
      "add a todd-coin participant to a todd-coin organization",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{
          baseUrl: string;
          accessToken: string;
          organizationId: string;
          participantId: string;
        }>
      ) => {
        try {
          const baseUrl = args.baseUrl as string;
          const accessToken = args.accessToken as string;
          const organizationId = args.organizationId as string;
          const participantId = args.participantId as string;

          await createOrganizationParticipantReference(
            baseUrl,
            accessToken,
            organizationId,
            participantId
          );

          console.log("All Done!");
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
      "add-authorized-signer-to-organization <baseUrl> <accessToken> <authorizedSignerId> <organizationId>",
      "add a todd-coin authorized signer to a todd-coin organization",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{
          baseUrl: string;
          accessToken: string;
          organizationId: string;
          authorizedSignerId: string;
        }>
      ) => {
        try {
          const baseUrl = args.baseUrl as string;
          const accessToken = args.accessToken as string;
          const organizationId = args.organizationId as string;
          const authorizedSignerId = args.authorizedSignerId as string;

          await createOrganizationAuthorizedSignerReference(
            baseUrl,
            accessToken,
            organizationId,
            authorizedSignerId
          );

          console.log("All Done!");
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
      "add-administrator-to-organization <baseUrl> <accessToken> <administratorId> <organizationId>",
      "add a todd-coin authorized signer to a todd-coin organization",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{
          baseUrl: string;
          accessToken: string;
          organizationId: string;
          administratorId: string;
        }>
      ) => {
        try {
          const baseUrl = args.baseUrl as string;
          const accessToken = args.accessToken as string;
          const organizationId = args.organizationId as string;
          const administratorId = args.administratorId as string;

          await createOrganizationAdministratorReference(
            baseUrl,
            accessToken,
            organizationId,
            administratorId
          );

          console.log("All Done!");
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
      "create-time-pending-tx <baseUrl> <accessToken> <description> <fromParticipantId> <fromOrganizaionId> <toParticipantId> <toOrganizaionId> <fromTime> <toTime>",
      "create a pending todd-coin transaction",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{
          baseUrl: string;
          accessToken: string;
          description: string;
          fromParticipantId: string;
          fromOrganizationId: string;
          toParticipantId: string;
          toOrganizationId: string;
          fromTime: string;
          toTime: string;
        }>
      ) => {
        try {
          const baseUrl = args.baseUrl as string;
          const accessToken = args.accessToken as string;
          const description = args.description as string;
          const fromParticipantId =
            args.fromParticipantId !== "n/a"
              ? (args.fromParticipantId as string)
              : undefined;
          const fromOrganizationId =
            args.fromOrganizationId !== "n/a"
              ? (args.fromOrganizationId as string)
              : undefined;
          const toParticipantId =
            args.toParticipantId !== "n/a"
              ? (args.toParticipantId as string)
              : undefined;
          const toOrganizationId =
            args.toOrganizationId !== "n/a"
              ? (args.toOrganizationId as string)
              : undefined;
          const fromTime = args.fromTime as string;
          const toTime = args.toTime as string;

          const pendingTransaction: PendingTransaction<TransactionDetails> =
            await createPendingTransaction(baseUrl, accessToken, {
              description,
              type: TransactionType.TIME,
              details: {
                dateRanges: [
                  {
                    from: fromTime,
                    to: toTime,
                  },
                ],
              },
              fromParticipant: fromParticipantId
                ? ({
                    id: fromParticipantId,
                  } as Participant)
                : undefined,
              fromOrganization: fromOrganizationId
                ? ({
                    id: fromOrganizationId,
                  } as Organization)
                : undefined,
              toParticipant: fromParticipantId
                ? ({
                    id: toParticipantId,
                  } as Participant)
                : undefined,
              toOrganization: fromOrganizationId
                ? ({
                    id: toOrganizationId,
                  } as Organization)
                : undefined,
            });

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
      "sign-pending-tx <baseUrl> <accessToken> <goodPoints> <signerParticipantId> <signerParticipantKeyId> <signerPrivateKey> <pendingTransactionId>",
      "sign a pending todd-coin transaction",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{
          baseUrl: string;
          accessToken: string;
          signerParticipantKeyId: string;
          signerPrivateKey: string;
          pendingTransactionId: string;
        }>
      ) => {
        try {
          const baseUrl = args.baseUrl as string;
          const accessToken = args.accessToken as string;
          const signerParticipantId = args.signerParticipantId as string;
          const signerParticipantKeyId = args.signerParticipantKeyId as string;
          const signerPrivateKey = args.signerPrivateKey as string;
          const goodPoints = args.goodPoints as number;
          const pendingTransactionId = args.pendingTransactionId as string;

          const pendingTransaction: PendingTransaction<TransactionDetails> =
            await getPendingTransactionById(baseUrl, pendingTransactionId);

          const signer: Participant = await getParticipantById(
            baseUrl,
            signerParticipantId
          );

          const signerParticipantKey: ParticipantKey =
            await getParticipantKeyById(
              baseUrl,
              signer.id as string,
              signerParticipantKeyId
            );

          const signedTransaction: SignedTransaction<TransactionDetails> =
            transactionUtils.signTransaction(
              pendingTransaction,
              goodPoints,
              signerParticipantKey,
              signerPrivateKey
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
      "update-signed-tx <baseUrl> <accessToken> <goodPoints> <signerParticipantId> <signerParticipantKeyId> <signerPrivateKey> <signedTransactionId>",
      "sign a pending todd-coin transaction",
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      async (
        args: ArgumentsCamelCase<{
          baseUrl: string;
          accessToken: string;
          signerParticipantKeyId: string;
          signerPrivateKey: string;
          signedTransactionId: string;
        }>
      ) => {
        try {
          const baseUrl = args.baseUrl as string;
          const accessToken = args.accessToken as string;
          const signerParticipantId = args.signerParticipantId as string;
          const signerParticipantKeyId = args.signerParticipantKeyId as string;
          const signerPrivateKey = args.signerPrivateKey as string;
          const goodPoints = args.goodPoints as number;
          const signedTransactionId = args.signedTransactionId as string;

          const existingSignedTransaction: SignedTransaction<TransactionDetails> =
            await getSignedTransactionById(baseUrl, signedTransactionId);

          const signer: Participant = await getParticipantById(
            baseUrl,
            signerParticipantId
          );

          const signerParticipantKey: ParticipantKey =
            await getParticipantKeyById(
              baseUrl,
              signer.id as string,
              signerParticipantKeyId
            );

          const updatedSignedTransaction: SignedTransaction<TransactionDetails> =
            transactionUtils.signTransaction(
              existingSignedTransaction,
              goodPoints,
              signerParticipantKey,
              signerPrivateKey
            );

          await updateSignedTransaction(
            baseUrl,
            accessToken,
            updatedSignedTransaction
          );

          console.log("All Done!");
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
      "validate <baseUrl>",
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
          const blocks: Block[] = await getBlocks(baseUrl);
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
      "get-balance <baseUrl> <participantId>",
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
          const participantId = args.participantId as string;
          const participant: Participant = await getParticipantById(
            baseUrl,
            participantId
          );
          const blocks: Block[] = await getBlocks(baseUrl);
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
