/**
 * OmniScribe Master Test Suite Runner
 */

import { runAuditEngineTests } from './audit-engine.test';
import { runDashboardLogicTests } from './dashboard-logic.test';
import { runEdgeCasesTests } from './edge-cases.test';

async function runAll() {
  console.log('=======================================================');
  console.log('   OmniScribe Regulatory Compliance Verification Suite ');
  console.log('=======================================================');
  const startTime = Date.now();

  try {
    runAuditEngineTests();
    runDashboardLogicTests();
    runEdgeCasesTests();

    const elapsed = Date.now() - startTime;
    console.log('=======================================================');
    console.log(`🎉 ALL TEST SUITES PASSED SUCCESSFULLY in ${elapsed}ms`);
    console.log('=======================================================');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ TEST FAILURE OCCURRED:');
    console.error(error);
    process.exit(1);
  }
}

runAll();
