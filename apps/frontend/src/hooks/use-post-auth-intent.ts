'use client';

import {
  createSessionIntentStore,
  getCurrentReturnPath,
  useRequireStoredPostAuthIntent,
  useStoredPostAuthIntentExecutor,
  type PostAuthIntentHandlers,
} from './post-auth-intent/core';
import {
  postAuthIntentSchema,
  type PostAuthIntent,
  type PostAuthIntentFor,
  type PostAuthIntentKind,
  type StagePostAuthIntentInput,
} from './post-auth-intent/intents';

const POST_AUTH_INTENT_STORAGE_KEY = 'namefi.postAuthIntent.v1';

export {
  getCurrentReturnPath,
  postAuthIntentSchema,
  type PostAuthIntent,
  type PostAuthIntentFor,
  type PostAuthIntentKind,
  type StagePostAuthIntentInput,
};

const postAuthIntentStore = createSessionIntentStore<
  PostAuthIntent,
  StagePostAuthIntentInput
>({
  storageKey: POST_AUTH_INTENT_STORAGE_KEY,
  schema: postAuthIntentSchema,
  buildIntent: (input) => ({
    version: 1,
    ...input,
  }),
});

export function readPostAuthIntent() {
  return postAuthIntentStore.readIntent();
}

export function clearPostAuthIntent() {
  postAuthIntentStore.clearIntent();
}

export function stagePostAuthIntent(input: StagePostAuthIntentInput) {
  return postAuthIntentStore.stageIntent(input);
}

export function useRequirePostAuthIntent() {
  return useRequireStoredPostAuthIntent(stagePostAuthIntent);
}

export function usePostAuthIntentExecutor(
  handlers: PostAuthIntentHandlers<PostAuthIntent>,
) {
  useStoredPostAuthIntentExecutor(postAuthIntentStore, handlers);
}
