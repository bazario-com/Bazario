const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

async function main() {
  const prisma = new PrismaClient();
  const newPassword = 'VendorTest123!';
  const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });

  const user = await prisma.user.update({
    where: { email: 'vendor@marketplace.test' },
    data: { passwordHash },
  });

  console.log('Password reset for:', user.email);
  console.log('New password:', newPassword);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
