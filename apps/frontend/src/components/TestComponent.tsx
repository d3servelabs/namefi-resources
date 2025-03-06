"use client";

import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function TestComponent(props: object) {
	const [count, setCount] = useState(0);
	const trpc = useTRPC();
	const listMessages = useQuery(trpc.message.listMessages.queryOptions());
	const addMessage = useMutation(trpc.message.addMessage.mutationOptions());

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
				{addMessage.isPending ? "Adding Message ..." : "Add Message"}
			</button>
			<ul>
				{listMessages.data?.map((message) => (
					<li key={message.id}>{message.text}</li>
				))}
			</ul>
		</div>
	);
}
