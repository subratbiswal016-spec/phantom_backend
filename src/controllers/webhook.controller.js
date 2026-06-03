import { User, VipContact, CallLog } from '../models/index.js';
import { getRedis } from '../config/redis.js';

/**
 * THE CORE MAGIC — Twilio Webhook Handler
 * 
 * When anyone calls the user's virtual number, Twilio sends a webhook here.
 * We check if the caller is VIP → forward or reject.
 */

// POST /webhook/incoming-call (called by Twilio — NO AUTH)
export const handleIncomingCall = async (req, res, next) => {
  try {
    const callerPhone = req.body.From || req.body.caller_id;  // Twilio: From, Exotel: caller_id
    const calledNumber = req.body.To || req.body.called_number;
    const callSid = req.body.CallSid || req.body.call_sid;

    console.log(`📞 Incoming call: ${callerPhone} → ${calledNumber}`);

    // 1. Find user by virtual number
    const user = await User.findOne({
      where: { virtualNumber: calledNumber },
    });

    if (!user) {
      console.log(`❌ No user found for virtual number: ${calledNumber}`);
      return res.type('text/xml').send(generateRejectTwiML());
    }

    // 2. Check VIP list (Redis first for speed, fallback to DB)
    const isVip = await checkIsVip(user.id, callerPhone);

    if (isVip) {
      // VIP caller — forward to real phone
      console.log(`⭐ VIP call from ${callerPhone} — forwarding to ${user.phone}`);
      await logCall(user.id, callerPhone, 'forwarded', callSid);
      return res.type('text/xml').send(generateForwardTwiML(user.phone));
    }

    // 3. Check if invisible mode is active
    if (user.isInvisible) {
      // Non-VIP and Invisible Mode ON -> Block
      console.log(`🚫 Blocked call from ${callerPhone} (Invisible Mode)`);
      await logCall(user.id, callerPhone, 'blocked', callSid);
      return res.type('text/xml').send(generateRejectTwiML(user.customMessage));
    }

    // 4. Invisible mode is OFF. Check if blockUnknown is ON.
    if (user.blockUnknown) {
      const isKnownContact = await checkIsKnownContact(user.id, callerPhone);
      if (!isKnownContact) {
        console.log(`🚫 Blocked call from ${callerPhone} (Unknown Number)`);
        await logCall(user.id, callerPhone, 'blocked', callSid);
        return res.type('text/xml').send(generateRejectTwiML('The number you are trying to reach is not accepting calls from unknown numbers.'));
      }
    }

    // 5. Otherwise, forward the call normally
    console.log(`✅ User ${user.phone} is VISIBLE — forwarding call`);
    await logCall(user.id, callerPhone, 'forwarded', callSid);
    return res.type('text/xml').send(generateForwardTwiML(user.phone));
  } catch (error) {
    console.error('❌ Webhook error:', error);
    // Always return valid TwiML even on error
    return res.type('text/xml').send(generateRejectTwiML());
  }
};

/**
 * Check if caller is in VIP list
 * Uses Redis SET for O(1) lookup, falls back to PostgreSQL
 */
async function checkIsVip(userId, callerPhone) {
  const redis = getRedis();

  // Normalize phone number (remove spaces, ensure +prefix)
  const normalizedPhone = normalizePhone(callerPhone);

  if (redis) {
    try {
      // Check Redis SET — O(1) operation, < 1ms
      const exists = await redis.sismember(`vip:${userId}`, normalizedPhone);
      if (exists) return true;

      // Check without country code variations
      const withoutCode = normalizedPhone.replace(/^\+91/, '');
      const withCode = `+91${withoutCode}`;
      
      const [r1, r2] = await Promise.all([
        redis.sismember(`vip:${userId}`, withoutCode),
        redis.sismember(`vip:${userId}`, withCode),
      ]);

      if (r1 || r2) return true;
    } catch (err) {
      console.error('Redis lookup failed, falling back to DB:', err.message);
    }
  }

  // Fallback: DB lookup
  const vip = await VipContact.findOne({
    where: { user_id: userId, phone: normalizedPhone },
  });

  return !!vip;
}

/**
 * Check if caller is in user's synced phonebook (Unknown numbers feature)
 */
async function checkIsKnownContact(userId, callerPhone) {
  // If caller hides their ID, it's definitely unknown
  if (!callerPhone || callerPhone === 'Anonymous' || callerPhone === 'Restricted') {
    return false;
  }

  const redis = getRedis();
  if (!redis) {
    // If Redis is down, we have to allow the call because we don't store the full address book in Postgres (for privacy/storage reasons)
    return true; 
  }

  const normalizedPhone = normalizePhone(callerPhone);
  
  try {
    const exists = await redis.sismember(`contacts:${userId}`, normalizedPhone);
    if (exists) return true;

    const withoutCode = normalizedPhone.replace(/^\+91/, '');
    const withCode = `+91${withoutCode}`;
    
    const [r1, r2] = await Promise.all([
      redis.sismember(`contacts:${userId}`, withoutCode),
      redis.sismember(`contacts:${userId}`, withCode),
    ]);

    return r1 || r2;
  } catch (err) {
    console.error('Redis lookup failed for known contacts:', err.message);
    return true; // Fail open
  }
}

function normalizePhone(phone) {
  // Remove spaces, dashes, parens
  let normalized = phone.replace(/[\s\-\(\)]/g, '');
  // Ensure + prefix
  if (!normalized.startsWith('+')) {
    normalized = `+${normalized}`;
  }
  return normalized;
}

async function logCall(userId, callerPhone, status, callSid) {
  try {
    await CallLog.create({
      userId,
      callerPhone: normalizePhone(callerPhone),
      status,
      twilioCallSid: callSid,
    });
  } catch (error) {
    console.error('Failed to log call:', error.message);
  }
}

/**
 * Generate TwiML to forward call to real phone
 */
function generateForwardTwiML(realPhone) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="+000000000">
    <Number>${realPhone}</Number>
  </Dial>
</Response>`;
}

/**
 * Generate TwiML to reject call with "switched off" message
 */
function generateRejectTwiML(customMessage) {
  if (customMessage) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${customMessage}</Say>
  <Hangup/>
</Response>`;
  }
  
  // Default: just reject (plays standard unavailable tone)
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Reject reason="rejected"/>
</Response>`;
}
