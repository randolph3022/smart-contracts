const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { setup } = require('./setup');

describe('migrateCoversFrom', function () {
  let fixture;
  beforeEach(async function () {
    fixture = await loadFixture(setup);
  });
  it('reverts if system is paused', async function () {
    const { coverMigrator, master } = fixture.contracts;
    const [coverOwner] = fixture.accounts.members;

    // enable emergency pause
    await master.setEmergencyPause(true);

    await expect(coverMigrator.connect(coverOwner).migrateCovers([1], coverOwner.address)).to.be.revertedWith(
      'System is paused',
    );
  });
});
