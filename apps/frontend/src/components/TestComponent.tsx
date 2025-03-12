'use client';

import { useMutation } from '@tanstack/react-query';

import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function TestComponent() {
  const [count, setCount] = useState<number>(2);
  const [messageId, setMessageId] = useState<number>();
  const [userUuid, setUserUuid] = useState<string>();
  const trpc = useTRPC();
  const listMessages = useQuery(trpc.message.listMessages.queryOptions());
  const addMessage = useMutation(trpc.message.addMessage.mutationOptions());

  const getMessage = useQuery(
    trpc.message.getMessage.queryOptions(messageId ?? -1, {
      enabled: !!messageId,
    }),
  );
  const primaryEmail = useQuery(
    trpc.users.getUserEmail.queryOptions(
      { id: userUuid ?? '' },
      {
        enabled: !!userUuid,
      },
    ),
  );
  const createUser = useMutation(trpc.users.createUser.mutationOptions());

  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-2 hover:underline hover:underline-offset-4 hover:bg-blue-700 bg-blue-500 hover:text-white px-4 py-2 rounded-md"
        onClick={async () => {
          await addMessage.mutateAsync(`Hello, world ${count}!`);
          setCount(count + 1);
          await listMessages.refetch();
        }}
        disabled={addMessage.isPending}
      >
        {addMessage.isPending ? 'Adding Message ...' : 'Add Message'}
      </button>
      <ul className="list-disc py-1 px-1 rounded-lg ring-1 ring-gray-300 *:list-inside mb-3 mt-1">
        {listMessages.data?.map((message) => (
          <li className="list-disc" key={message.id}>
            {message.text}
          </li>
        ))}
      </ul>
      <input
        type="number"
        className="border border-gray-300 rounded-md p-2 bg-blue-50 text-black"
        value={messageId}
        onChange={(e) => setMessageId(Number.parseInt(e.target.value))}
      />
      <button
        type="button"
        className="flex items-center gap-2 hover:underline hover:underline-offset-4 hover:bg-blue-700 bg-blue-500 hover:text-white px-4 py-2 rounded-md"
        onClick={() => getMessage.refetch()}
      >
        {getMessage.isFetching ? 'Getting Message ...' : 'Get Message'}
      </button>
      <p>{getMessage.data?.text}</p>
      <button
        type="button"
        className="flex items-center gap-2 hover:underline hover:underline-offset-4 hover:bg-blue-700 bg-blue-500 hover:text-white px-4 py-2 rounded-md"
        onClick={async () => {
          const res = await createUser.mutateAsync({
            primaryEmail: `test-${uuidv4()}@test.com`,
          });
          console.log('res', res);
          setUserUuid(res.id);
          await primaryEmail.refetch();
        }}
      >
        {createUser.isPending ? 'Creating User ...' : 'Create User'}
      </button>

      {primaryEmail.isLoading && <p>Loading...</p>}
      {primaryEmail.error && <p>Error: {primaryEmail.error.message}</p>}
      {primaryEmail.isSuccess && <p>{primaryEmail.data.primaryEmail}</p>}
    </div>
  );
}
