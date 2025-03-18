export async function greet(name: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(`Hello, ${name}!`);
}
