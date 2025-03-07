import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, router } from '../context';

let id = 0;

const mockDB = {
  messages: [createMessage('initial message')],
};

function createMessage(text: string) {
  const msg = {
    id: ++id,
    text,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return msg;
}

export const messageRouter = router({
  addMessage: publicProcedure.input(z.string()).mutation(({ input }) => {
    const msg = createMessage(input);
    mockDB.messages.push(msg);

    return msg;
  }),
  listMessages: publicProcedure.query(() => mockDB.messages),
  getMessage: publicProcedure.input(z.number()).query(({ input }) => {
    const msg = mockDB.messages.find((m) => m.id === input);
    if (!msg) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Message not found' });
    }
    return msg;
  }),
});
