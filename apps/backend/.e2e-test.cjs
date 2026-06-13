/* End-to-end test of registration → org creation → invitation → join → switch.
   Drives the real gateway over HTTP and validates DB state via Mongoose.
   Cleans up its own test data at the end. */
const mongoose = require('mongoose');

const BASE = 'http://localhost:3000/api/v1';
const MONGO = 'mongodb://localhost:27017/property-manager';
const TS = Date.now();
const EMAIL1 = `e2e.owner.${TS}@example.com`;
const EMAIL2 = `e2e.joiner.${TS}@example.com`;
const PASSWORD = 'Password1!';

const results = [];
const check = (name, cond, detail = '') => {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? '  ✅' : '  ❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const jwt = (token) =>
  JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  return { status: res.status, data };
}

const signupBody = (email) => ({
  email,
  firstName: 'E2E',
  lastName: 'Tester',
  phoneNumber: '+5491122334455',
  password: PASSWORD,
  confirmPassword: PASSWORD,
});

async function registerAndVerify(conn, email, label) {
  const signup = await api('/auth/signup', {
    method: 'POST',
    body: signupBody(email),
  });
  check(`${label}: signup succeeds`, signup.data?.success === true, `status ${signup.status}`);
  check(`${label}: signup returns verificationToken`, !!signup.data?.verificationToken);

  const userDoc = await conn.db.collection('users').findOne({ email });
  check(`${label}: user persisted in control plane`, !!userDoc);
  check(`${label}: user starts unverified with a code`,
    userDoc?.emailVerified === false && !!userDoc?.emailVerification?.code);

  const verify = await api('/auth/verify-email', {
    method: 'POST',
    body: { token: signup.data.verificationToken, code: userDoc.emailVerification.code },
  });
  check(`${label}: email verification succeeds`, verify.data?.success === true);
  check(`${label}: verification issues tokens`, !!verify.data?.tokens?.accessToken);

  const after = await conn.db.collection('users').findOne({ email });
  check(`${label}: emailVerified flag set in DB`, after?.emailVerified === true);

  return verify.data.tokens;
}

(async () => {
  const conn = await mongoose.createConnection(MONGO).asPromise();
  let acmeSlug = null;
  let globexSlug = null;

  try {
    console.log('\n— 1. Registration & DB validation —');
    let u1 = await registerAndVerify(conn, EMAIL1, 'user1');
    const u1Claims = jwt(u1.accessToken);
    check('user1: fresh user has NO tenant in JWT', u1Claims.tenantId === null,
      `tenantId=${u1Claims.tenantId}`);

    console.log('\n— 2. New user without organization —');
    const orgs0 = await api('/organizations', { token: u1.accessToken });
    check('user1: GET /organizations is empty', orgs0.data?.organizations?.length === 0);
    const members0 = await api('/organizations/members', { token: u1.accessToken });
    check('user1: members list rejected without org (400)', members0.status === 400);

    console.log('\n— 3. Create organization from dashboard flow —');
    const created = await api('/organizations', {
      method: 'POST',
      token: u1.accessToken,
      body: { name: `E2E Acme Holdings ${TS}`, country: 'Argentina' },
    });
    check('create org succeeds', created.data?.success === true, `status ${created.status}`);
    check('create org returns scoped tokens', !!created.data?.tokens?.accessToken);
    u1 = created.data.tokens;
    const u1Scoped = jwt(u1.accessToken);
    acmeSlug = u1Scoped.tenantSlug;
    check('new token scoped to new org as OWNER',
      !!u1Scoped.tenantId && u1Scoped.role === 'owner', `slug=${u1Scoped.tenantSlug} role=${u1Scoped.role}`);

    const tenantDoc = await conn.db.collection('tenants').findOne({ slug: acmeSlug });
    check('tenant persisted in control plane', !!tenantDoc);
    const ownerMembership = await conn.db.collection('memberships').findOne({
      tenantId: tenantDoc?._id,
    });
    check('owner membership persisted (owner + primary)',
      ownerMembership?.role === 'owner' && ownerMembership?.isPrimary === true);

    const orgs1 = await api('/organizations', { token: u1.accessToken });
    check('switcher list shows 1 org (primary)',
      orgs1.data?.organizations?.length === 1 && orgs1.data.organizations[0].isPrimary === true);

    console.log('\n— 4. Tenant-scoped data + login persistence —');
    const prop = await api('/properties', {
      method: 'POST',
      token: u1.accessToken,
      body: { name: 'HQ Building', address: '1 Main St' },
    });
    check('property created in tenant DB', prop.data?.success === true);
    const tenantConn = conn.useDb(`tenant_${acmeSlug}`);
    const propCount = await tenantConn.db.collection('properties').countDocuments();
    check('property physically isolated in tenant DB', propCount === 1,
      `tenant_${acmeSlug}.properties = ${propCount}`);

    const signin = await api('/auth/signin', {
      method: 'POST',
      body: { email: EMAIL1, password: PASSWORD },
    });
    const signinClaims = jwt(signin.data.tokens.accessToken);
    check('signin lands in primary org (persistence)',
      signinClaims.tenantSlug === acmeSlug && signinClaims.role === 'owner');

    console.log('\n— 5. Second user + invitation + join —');
    let u2 = await registerAndVerify(conn, EMAIL2, 'user2');
    check('user2: fresh user has no tenant', jwt(u2.accessToken).tenantId === null);

    const invite = await api('/organizations/invitations', {
      method: 'POST',
      token: u1.accessToken,
      body: { role: 'manager' },
    });
    check('owner can create invitation', !!invite.data?.invitation?.code,
      `code=${invite.data?.invitation?.code} role=${invite.data?.invitation?.role}`);

    const join = await api('/organizations/join', {
      method: 'POST',
      token: u2.accessToken,
      body: { code: invite.data.invitation.code },
    });
    check('user2 joins via invitation', join.data?.success === true, `status ${join.status}`);
    u2 = join.data.tokens;
    const u2Claims = jwt(u2.accessToken);
    check('user2 token scoped to joined org with invited role',
      u2Claims.tenantSlug === acmeSlug && u2Claims.role === 'manager');

    const inviteDoc = await conn.db.collection('invitations').findOne({
      code: invite.data.invitation.code,
    });
    check('invitation marked accepted in DB',
      inviteDoc?.status === 'accepted' && !!inviteDoc?.acceptedBy);

    const acmeMembers = await api('/organizations/members', { token: u1.accessToken });
    check('members list shows both users with roles',
      acmeMembers.data?.members?.length === 2 &&
        acmeMembers.data.members.some((m) => m.role === 'manager'));

    console.log('\n— 6. Multi-org + switching —');
    const globex = await api('/organizations', {
      method: 'POST',
      token: u2.accessToken,
      body: { name: `E2E Globex ${TS}`, country: 'Argentina' },
    });
    u2 = globex.data.tokens;
    globexSlug = jwt(u2.accessToken).tenantSlug;
    check('user2 creates 2nd org while belonging to another',
      globex.data?.success === true && jwt(u2.accessToken).role === 'owner');

    const u2Orgs = await api('/organizations', { token: u2.accessToken });
    const acmeEntry = u2Orgs.data?.organizations?.find((o) => o.slug === acmeSlug);
    check('user2 sees 2 orgs; joined org stays primary',
      u2Orgs.data?.organizations?.length === 2 && acmeEntry?.isPrimary === true,
      JSON.stringify(u2Orgs.data?.organizations?.map((o) => `${o.slug}:${o.role}${o.isPrimary ? ':primary' : ''}`)));

    const acmeTenantId = String(tenantDoc._id);
    const switched = await api('/organizations/switch', {
      method: 'POST',
      token: u2.accessToken,
      body: { tenantId: acmeTenantId },
    });
    check('user2 switches back to Acme',
      switched.data?.success === true && jwt(switched.data.tokens.accessToken).tenantSlug === acmeSlug);

    const refreshed = await api('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: switched.data.tokens.refreshToken },
    });
    check('token refresh preserves active org',
      jwt(refreshed.data.tokens.accessToken).tenantSlug === acmeSlug);

    console.log('\n— 7. Edge cases —');
    const badCode = await api('/organizations/join', {
      method: 'POST',
      token: u1.accessToken,
      body: { code: 'DEADBEEF' },
    });
    check('invalid code rejected (400 invalid_invitation)',
      badCode.status === 400 && JSON.stringify(badCode.data).includes('invalid_invitation'));

    const reused = await api('/organizations/join', {
      method: 'POST',
      token: u1.accessToken,
      body: { code: invite.data.invitation.code },
    });
    check('used code rejected (single-use)',
      reused.status === 400 && JSON.stringify(reused.data).includes('invitation_already_used'));

    const invite2 = await api('/organizations/invitations', {
      method: 'POST',
      token: u1.accessToken,
      body: {},
    });
    const selfJoin = await api('/organizations/join', {
      method: 'POST',
      token: u1.accessToken,
      body: { code: invite2.data.invitation.code },
    });
    check('joining an org you already belong to rejected',
      selfJoin.status === 400 && JSON.stringify(selfJoin.data).includes('already_a_member'));

    const managerInvite = await api('/organizations/invitations', {
      method: 'POST',
      token: switched.data.tokens.accessToken, // user2 scoped to Acme as manager
      body: {},
    });
    check('manager cannot create invitations (403)', managerInvite.status === 403);

    const globexTenant = await conn.db.collection('tenants').findOne({ slug: globexSlug });
    const foreignSwitch = await api('/organizations/switch', {
      method: 'POST',
      token: u1.accessToken,
      body: { tenantId: String(globexTenant._id) },
    });
    check('switching to a non-member org rejected (403)', foreignSwitch.status === 403);

    const noOrgInvite = await api('/organizations/invitations', {
      method: 'POST',
      token: signin.data.tokens.accessToken,
      body: {},
    });
    check('owner CAN invite via signin token too', noOrgInvite.status === 201 || noOrgInvite.status === 200);

    console.log('\n— 8. Property owners —');
    // Fresh property to attach owners to (owner-scoped token = user1 on Acme).
    const ownerProp = await api('/properties', {
      method: 'POST',
      token: u1.accessToken,
      body: { name: `Owner Tower ${TS}`, address: '9 Owner Ave' },
    });
    const ownerProperty = ownerProp.data?.property ?? ownerProp.data;
    const propRef = ownerProperty?.slug ?? ownerProperty?._id;
    check('owners: property for owners created', !!propRef, `ref=${propRef}`);

    // Create an owner already attached to the property.
    const owner1 = await api(`/owners?propertyId=${ownerProperty._id}`, {
      method: 'POST',
      token: u1.accessToken,
      body: { fullName: 'Olivia Owner', email: 'olivia@example.com' },
    });
    check('owners: create owner attached on create',
      owner1.data?.success === true && !!owner1.data?.owner?._id,
      `status ${owner1.status}`);
    const owner1Id = owner1.data?.owner?._id;

    const list1 = await api(`/properties/${propRef}/owners`, { token: u1.accessToken });
    check('owners: property lists the attached owner',
      list1.data?.owners?.length === 1 && list1.data.owners[0]._id === owner1Id);

    // Standalone owner (no property), then attach it.
    const owner2 = await api('/owners', {
      method: 'POST',
      token: u1.accessToken,
      body: { fullName: 'Owen Holder', phone: '+5491133224455' },
    });
    const owner2Id = owner2.data?.owner?._id;
    check('owners: create standalone owner', !!owner2Id);

    const attach = await api(`/properties/${propRef}/owners/attach`, {
      method: 'POST',
      token: u1.accessToken,
      body: { ownerIds: [owner2Id] },
    });
    check('owners: attach existing owner → roster of 2',
      attach.data?.success === true && attach.data?.owners?.length === 2);

    // Idempotent: attaching the same owner again does not duplicate.
    const attachDup = await api(`/properties/${propRef}/owners/attach`, {
      method: 'POST',
      token: u1.accessToken,
      body: { ownerIds: [owner2Id] },
    });
    check('owners: duplicate attach is a no-op (still 2)',
      attachDup.data?.owners?.length === 2);

    // A manager may also manage owners (ROLES_THAT_MANAGE_PROPERTIES).
    const managerOwner = await api('/owners', {
      method: 'POST',
      token: switched.data.tokens.accessToken,
      body: { fullName: 'Manny Manager-Owner' },
    });
    check('owners: manager can create owners', managerOwner.data?.success === true,
      `status ${managerOwner.status}`);

    // Detach owner1; the roster shrinks but the record survives.
    const detach = await api(`/properties/${propRef}/owners/${owner1Id}`, {
      method: 'DELETE',
      token: u1.accessToken,
    });
    check('owners: detach owner from property', detach.data?.success === true);

    const list2 = await api(`/properties/${propRef}/owners`, { token: u1.accessToken });
    check('owners: property roster shrinks to 1 after detach',
      list2.data?.owners?.length === 1 && list2.data.owners[0]._id === owner2Id);

    const roster = await api('/owners', { token: u1.accessToken });
    check('owners: detached owner survives in org roster',
      roster.data?.owners?.some((o) => o._id === owner1Id));

    const ownerCount = await tenantConn.db.collection('propertyowners').countDocuments();
    check('owners: physically isolated in tenant DB', ownerCount >= 3,
      `tenant_${acmeSlug}.propertyowners = ${ownerCount}`);
  } finally {
    console.log('\n— Cleanup of e2e artifacts —');
    const users = await conn.db.collection('users').find({ email: { $in: [EMAIL1, EMAIL2] } }).toArray();
    const userIds = users.map((u) => u._id);
    const tenants = await conn.db.collection('tenants').find({ name: new RegExp(`${TS}$`) }).toArray();
    const tenantIds = tenants.map((t) => t._id);
    await conn.db.collection('users').deleteMany({ _id: { $in: userIds } });
    await conn.db.collection('memberships').deleteMany({ userId: { $in: userIds } });
    await conn.db.collection('invitations').deleteMany({ tenantId: { $in: tenantIds } });
    await conn.db.collection('tenants').deleteMany({ _id: { $in: tenantIds } });
    for (const t of tenants) {
      await conn.useDb(t.dbName).dropDatabase();
    }
    console.log(`  removed ${userIds.length} users, ${tenantIds.length} tenants (+memberships, invitations, tenant DBs)`);
    await conn.close();

    const failed = results.filter((r) => !r.pass);
    console.log(`\n========== ${results.length - failed.length}/${results.length} checks passed ==========`);
    if (failed.length) {
      failed.forEach((f) => console.log(`FAILED: ${f.name} ${f.detail}`));
      process.exit(1);
    }
  }
})().catch((e) => {
  console.error('E2E crashed:', e);
  process.exit(1);
});
