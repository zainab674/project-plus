import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkToken() {
  try {
    const token = 'e8918f6ac0c20dc6ebbe48c4010de806d63d22b4f04d2624f64855c905553824';
    const invitation = await prisma.invitation.findUnique({
      where: { token }
    });
    
    if (invitation) {
      // Token exists in database
    } else {
      // Token NOT found in database - token was already used and deleted
    }
  } catch (error) {
    // Error occurred
  } finally {
    await prisma.$disconnect();
  }
}

checkToken();
