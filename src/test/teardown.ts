export default async function globalTeardown() {
  const instance: any = (global as any).__MONGOINSTANCE;
  if (instance) {
    await instance.stop();
  }
}
