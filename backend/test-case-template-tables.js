// Test script to check if case template tables exist
import { prisma } from './prisma/index.js';

async function testCaseTemplateTables() {
    try {
        
        // Try to query the CaseTemplate table
        const templates = await prisma.caseTemplate.findMany({
            take: 1
        });

        // Try to query related tables
        const phases = await prisma.caseTemplatePhase.findMany({
            take: 1
        });
        
        const folders = await prisma.caseTemplateFolder.findMany({
            take: 1
        });
        
        const files = await prisma.caseTemplateFile.findMany({
            take: 1
        });

    } catch (error) {
        
        if (error.message.includes('does not exist')) {
        }
    } finally {
        await prisma.$disconnect();
    }
}

testCaseTemplateTables();
