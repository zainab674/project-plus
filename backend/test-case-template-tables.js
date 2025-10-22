// Test script to check if case template tables exist
import { prisma } from './prisma/index.js';

async function testCaseTemplateTables() {
    try {
        console.log('Testing case template tables...');
        
        // Try to query the CaseTemplate table
        const templates = await prisma.caseTemplate.findMany({
            take: 1
        });
        
        console.log('✅ CaseTemplate table exists and is accessible');
        console.log('Current templates count:', templates.length);
        
        // Try to query related tables
        const phases = await prisma.caseTemplatePhase.findMany({
            take: 1
        });
        console.log('✅ CaseTemplatePhase table exists');
        
        const folders = await prisma.caseTemplateFolder.findMany({
            take: 1
        });
        console.log('✅ CaseTemplateFolder table exists');
        
        const files = await prisma.caseTemplateFile.findMany({
            take: 1
        });
        console.log('✅ CaseTemplateFile table exists');
        
        console.log('All case template tables are ready!');
        
    } catch (error) {
        console.error('❌ Error accessing case template tables:', error.message);
        
        if (error.message.includes('does not exist')) {
            console.log('\n🔧 SOLUTION: Run database migration to create the tables:');
            console.log('npx prisma db push');
        }
    } finally {
        await prisma.$disconnect();
    }
}

testCaseTemplateTables();
