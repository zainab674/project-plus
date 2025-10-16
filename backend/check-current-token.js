import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkToken() {
  try {
    const token = 'e8918f6ac0c20dc6ebbe48c4010de806d63d22b4f04d2624f64855c905553824';
    const invitation = await prisma.invitation.findUnique({
      where: { token }
    });
    
    if (invitation) {
      console.log('✅ Token exists in database:');
      console.log('Token:', invitation.token);
      console.log('Role:', invitation.role);
      console.log('Project ID:', invitation.project_id);
      console.log('Expires at:', invitation.expires_at);
      console.log('Is expired:', invitation.expires_at < new Date());
      console.log('Leader ID:', invitation.leader_id);
      console.log('User ID:', invitation.user_id);
    } else {
      console.log('❌ Token NOT found in database');
      console.log('This means the token was already used and deleted.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkToken();
