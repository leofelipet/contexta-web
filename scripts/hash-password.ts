import { hash } from "bcryptjs";

async function main() {
  const password = process.argv.slice(2).find((argument) => argument !== "--");
  if (!password) {
    console.error("Uso: pnpm password:hash -- sua-senha");
    process.exitCode = 1;
    return;
  }

  const value = await hash(password, 12);
  console.log(`ADMIN_PASSWORD_HASH='${value}'`);
}

void main();
