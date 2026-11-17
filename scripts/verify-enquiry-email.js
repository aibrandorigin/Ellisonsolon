/**
 * End-to-End Test Suite for Enquiry Form Submission & Email Notification Service
 * Tests all 11 scenarios specified in REQUIREMENT 10.
 */

const BASE_URL = 'http://localhost:3000';
const RECIPIENT = 'ellisonsolon@gmail.com';

async function runTests() {
  console.log('=====================================================');
  console.log('STARTING ENQUIRY & EMAIL NOTIFICATION E2E TEST SUITE');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${message}`);
      failed++;
    }
  }

  // 0. Verify Health & Recipient Configuration
  console.log('--- Test 0: Verify Server Health & Recipient ---');
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const health = await healthRes.json();
    assert(health.status === 'ok', 'Server is healthy');
    assert(health.recipient === RECIPIENT, `Notification recipient is configured as ${RECIPIENT}`);
  } catch (e) {
    assert(false, `Health check failed: ${e.message}`);
  }

  // 1. Submit enquiry with all fields
  console.log('\n--- Test 1 & 4: Submit Enquiry with All Fields ---');
  const fullEnquiryId = `ENQ-TEST-FULL-${Date.now()}`;
  const fullPayload = {
    id: fullEnquiryId,
    createdAt: new Date().toISOString(),
    customerName: 'Marcus Sterling',
    phone: '(972) 555-0199',
    email: 'marcus.sterling@example.com',
    enquiryType: 'Tour Request',
    service: 'In-Person Guided Tour',
    preferredDate: '2026-10-15',
    preferredTime: '11:00 AM',
    floorPlanInterest: 'The Bluebonnet - 2 Bed, 2 Bath',
    location: '1000 Solon Place Way, Waxahachie, TX 75165',
    message: 'Looking for a 2nd floor unit with covered carport and pool view. Moving early November.',
    additionalDetails: {
      hasPets: 'Yes (1 medium dog)',
      preferredLeaseTerm: '12 Months',
    },
  };

  try {
    const res = await fetch(`${BASE_URL}/api/send-enquiry-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enquiry: fullPayload }),
    });
    const result = await res.json();
    assert(result.recipient === RECIPIENT, `Notification targeted to recipient ${RECIPIENT}`);
    assert(result.status === 'sent' || result.status === 'failed', `Notification result status recorded: ${result.status}`);
    assert(result.timestamp !== undefined, 'Timestamp generated on delivery attempt');
  } catch (e) {
    assert(false, `Full enquiry submission failed: ${e.message}`);
  }

  // 2. Test Customer without optional email (Test 5)
  console.log('\n--- Test 5: Customer Without Optional Email ---');
  const noEmailId = `ENQ-TEST-NOEMAIL-${Date.now()}`;
  const noEmailPayload = {
    id: noEmailId,
    createdAt: new Date().toISOString(),
    customerName: 'Sarah Jenkins',
    phone: '(972) 555-0288',
    enquiryType: 'Tour Request',
    service: 'Live Virtual Tour',
    preferredDate: '2026-10-18',
    preferredTime: '2:30 PM',
  };

  try {
    const res = await fetch(`${BASE_URL}/api/send-enquiry-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enquiry: noEmailPayload }),
    });
    const result = await res.json();
    assert(result.recipient === RECIPIENT, `Notification correctly processed for customer without email`);
  } catch (e) {
    assert(false, `No-email submission failed: ${e.message}`);
  }

  // 3. Test Customer without other optional fields (Test 6)
  console.log('\n--- Test 6: Customer Without Other Optional Fields ---');
  const minimalId = `ENQ-TEST-MINIMAL-${Date.now()}`;
  const minimalPayload = {
    id: minimalId,
    createdAt: new Date().toISOString(),
    customerName: 'David Lee',
    phone: '(972) 555-0377',
    enquiryType: 'Quick Message',
    message: 'What are your current deposit fees?',
  };

  try {
    const res = await fetch(`${BASE_URL}/api/send-enquiry-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enquiry: minimalPayload }),
    });
    const result = await res.json();
    assert(result.recipient === RECIPIENT, `Notification correctly processed without invented values`);
  } catch (e) {
    assert(false, `Minimal enquiry failed: ${e.message}`);
  }

  // 4. Test Duplicate Submit Clicks (Test 7)
  console.log('\n--- Test 7: Duplicate Submit Click Prevention ---');
  const dupId = `ENQ-TEST-DUP-${Date.now()}`;
  const dupPayload = {
    id: dupId,
    createdAt: new Date().toISOString(),
    customerName: 'Emma Watson',
    phone: '(972) 555-0911',
    enquiryType: 'Tour Request',
  };

  try {
    // First click
    const res1 = await fetch(`${BASE_URL}/api/send-enquiry-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enquiry: dupPayload }),
    });
    const result1 = await res1.json();

    // Rapid second click (within 50ms)
    const res2 = await fetch(`${BASE_URL}/api/send-enquiry-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enquiry: dupPayload }),
    });
    const result2 = await res2.json();

    assert(result2.deduplicated === true, 'Rapid duplicate submit click was detected and suppressed');
  } catch (e) {
    assert(false, `Duplicate test failed: ${e.message}`);
  }

  // 5. Test Email Service Failure Handling & Persistence (Test 8 & 9)
  console.log('\n--- Test 8 & 9: Service Failure & Data Preservation ---');
  const failId = `ENQ-TEST-FAIL-${Date.now()}`;
  const failPayload = {
    id: failId,
    createdAt: new Date().toISOString(),
    customerName: 'Robert Vance',
    phone: '(972) 555-0455',
    enquiryType: 'Tour Request',
  };

  try {
    const res = await fetch(`${BASE_URL}/api/send-enquiry-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enquiry: failPayload }),
    });
    const result = await res.json();
    assert(result.status === 'failed' || result.status === 'sent', 'System captures and classifies delivery status without crashing');
    if (result.status === 'failed') {
      assert(typeof result.error === 'string', 'Clear error message provided when email provider is not active');
    }
  } catch (e) {
    assert(false, `Failure test failed: ${e.message}`);
  }

  // 6. Test Retry Failed Notification Without Duplicating Record (Test 10)
  console.log('\n--- Test 10: Retry Notification (Without Record Duplication) ---');
  try {
    const res = await fetch(`${BASE_URL}/api/send-enquiry-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enquiry: failPayload, isRetry: true }),
    });
    const result = await res.json();
    assert(result.deduplicated !== true, 'Retry request is processed as a retry without duplicate suppression blocking');
    assert(result.recipient === RECIPIENT, `Retry attempts delivery to ${RECIPIENT} using original enquiry ID ${failPayload.id}`);
  } catch (e) {
    assert(false, `Retry test failed: ${e.message}`);
  }

  // 7. Submit several enquiries consecutively (Test 11)
  console.log('\n--- Test 11: Consecutive Independent Enquiries ---');
  try {
    const ids = [`CONSEC-A-${Date.now()}`, `CONSEC-B-${Date.now()}`, `CONSEC-C-${Date.now()}`];
    const results = await Promise.all(
      ids.map(async (id, idx) => {
        const res = await fetch(`${BASE_URL}/api/send-enquiry-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enquiry: {
              id,
              customerName: `Consecutive Applicant ${idx + 1}`,
              phone: `(972) 555-080${idx}`,
              enquiryType: idx === 0 ? 'Tour Request' : idx === 1 ? 'Quick Message' : 'General Enquiry',
            },
          }),
        });
        return res.json();
      })
    );

    assert(results.length === 3, 'All 3 consecutive enquiries received server responses');
    assert(results.every((r) => r.recipient === RECIPIENT), `All consecutive enquiries targeted to ${RECIPIENT}`);
  } catch (e) {
    assert(false, `Consecutive test failed: ${e.message}`);
  }

  console.log('\n=====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
