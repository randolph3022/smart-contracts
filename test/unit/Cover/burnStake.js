const { ethers } = require('hardhat');
const { assertCoverFields, buyCoverOnOnePool, buyCoverOnMultiplePools, createStakingPool } = require('./helpers');
const { expect } = require('chai');

const { MaxUint256 } = ethers.constants;
const { parseEther } = ethers.utils;

const gracePeriod = 120 * 24 * 3600; // 120 days

describe('burnStake', function () {
  const coverBuyFixture = {
    coverId: MaxUint256,
    productId: 0,
    coverAsset: 0, // ETH
    period: 3600 * 24 * 30, // 30 days
    amount: parseEther('1000'),
    targetPriceRatio: 260,
    priceDenominator: 10000,
    activeCover: parseEther('5000'),
    capacity: parseEther('10000'),
    capacityFactor: '10000',
  };

  it('should perform a burn a cover with 1 segment and 1 pool allocation', async function () {
    const { cover } = this;

    const {
      internalContracts: [internal1],
    } = this.accounts;

    const { productId, coverAsset, period, amount, targetPriceRatio } = coverBuyFixture;
    const { segmentId, coverId: expectedCoverId } = await buyCoverOnOnePool.call(this, coverBuyFixture);

    const burnAmountDivisor = 2;
    const burnAmount = amount.div(burnAmountDivisor);
    const remainingAmount = amount.sub(burnAmount);

    const segmentAllocation = await cover.coverSegmentAllocations(expectedCoverId, segmentId, '0');
    const expectedBurnAmount = segmentAllocation.coverAmountInNXM.div(burnAmountDivisor);

    await cover.connect(internal1).burnStake(expectedCoverId, segmentId, burnAmount);
    await assertCoverFields(cover, expectedCoverId, {
      productId,
      coverAsset,
      period,
      amount: remainingAmount,
      targetPriceRatio,
      gracePeriod,
      segmentId,
      amountPaidOut: burnAmount,
    });

    const stakingPool = await ethers.getContractAt('CoverMockStakingPool', await cover.stakingPool(0));
    const burnStakeCalledWith = await stakingPool.burnStakeCalledWith();
    expect(burnStakeCalledWith).to.be.equal(expectedBurnAmount);
  });

  it('reverts if caller is not an internal contract', async function () {
    const { cover } = this;
    const {
      members: [member],
    } = this.accounts;
    const { amount } = coverBuyFixture;
    const { segmentId, coverId: expectedCoverId } = await buyCoverOnOnePool.call(this, coverBuyFixture);

    const burnAmountDivisor = 2;
    const burnAmount = amount.div(burnAmountDivisor);

    await expect(cover.connect(member).burnStake(expectedCoverId, segmentId, burnAmount)).to.be.revertedWith(
      'Caller is not an internal contract',
    );
  });

  it.skip('does not update total active cover if tracking is not enabled', async function () {
    const { cover } = this;
    const {
      internalContracts: [internal1],
    } = this.accounts;
    const { coverAsset, amount } = coverBuyFixture;
    const { segmentId, coverId: expectedCoverId } = await buyCoverOnOnePool.call(this, coverBuyFixture);

    const burnAmountDivisor = 2;
    const burnAmount = amount.div(burnAmountDivisor);

    const activeCoverAmountBefore = await cover.totalActiveCoverInAsset(coverAsset);
    await cover.connect(internal1).burnStake(expectedCoverId, segmentId, burnAmount);
    const activeCoverAmountAfter = await cover.totalActiveCoverInAsset(coverAsset);

    expect(activeCoverAmountAfter).to.be.equal(activeCoverAmountBefore);
  });

  it('updates segment allocation cover amount in nxm', async function () {
    const { cover } = this;
    const {
      internalContracts: [internal1],
    } = this.accounts;
    const { amount } = coverBuyFixture;
    const { segmentId, coverId: expectedCoverId } = await buyCoverOnOnePool.call(this, coverBuyFixture);

    const burnAmountDivisor = 2;
    const burnAmount = amount.div(burnAmountDivisor);
    const segmentAllocationBefore = await cover.coverSegmentAllocations(expectedCoverId, segmentId, 0);
    const expectedBurnAmount = segmentAllocationBefore.coverAmountInNXM.div(burnAmountDivisor);

    await cover.connect(internal1).burnStake(expectedCoverId, segmentId, burnAmount);

    const segmentAllocationAfter = await cover.coverSegmentAllocations(expectedCoverId, segmentId, 0);
    expect(segmentAllocationAfter.coverAmountInNXM).to.be.equal(
      segmentAllocationBefore.coverAmountInNXM.sub(expectedBurnAmount),
    );
  });

  it('should perform a burn on a cover with 1 segment and 2 pool allocations', async function () {
    const { cover } = this;
    const {
      internalContracts: [internal1],
      members: [, stakingPoolManager],
    } = this.accounts;
    const { productId, coverAsset, period, amount, targetPriceRatio, capacity, activeCover } = coverBuyFixture;
    const amountOfPools = 4;
    const amountPerPool = amount.div(amountOfPools);

    const allocationRequest = [];
    for (let i = 0; i < amountOfPools; i++) {
      await createStakingPool(
        cover,
        productId,
        capacity,
        targetPriceRatio,
        activeCover,
        stakingPoolManager,
        stakingPoolManager,
        targetPriceRatio,
      );
      allocationRequest.push({ poolId: i, coverAmountInAsset: amountPerPool });
    }

    const { segmentId, coverId: expectedCoverId } = await buyCoverOnMultiplePools.call(this, {
      ...coverBuyFixture,
      allocationRequest,
    });

    const burnAmountDivisor = 2;
    const burnAmount = amount.div(burnAmountDivisor);
    const remainingAmount = amount.sub(burnAmount);
    const segmentAllocationsBefore = [];

    for (let i = 0; i < amountOfPools; i++) {
      const segmentAllocationBefore = await cover.coverSegmentAllocations(expectedCoverId, segmentId, i);
      segmentAllocationsBefore.push(segmentAllocationBefore);
    }

    const expectedBurnAmountPerPool = segmentAllocationsBefore[0].coverAmountInNXM.div(burnAmountDivisor);
    await cover.connect(internal1).burnStake(expectedCoverId, segmentId, burnAmount);
    await assertCoverFields(cover, expectedCoverId, {
      productId,
      coverAsset,
      period,
      amount: remainingAmount,
      targetPriceRatio,
      gracePeriod,
      segmentId,
      amountPaidOut: burnAmount,
    });

    for (let i = 0; i < amountOfPools; i++) {
      const stakingPool = await ethers.getContractAt('CoverMockStakingPool', await cover.stakingPool(i));

      const burnStakeCalledWith = await stakingPool.burnStakeCalledWith();
      expect(burnStakeCalledWith).to.be.equal(expectedBurnAmountPerPool);

      const segmentAllocationAfter = await cover.coverSegmentAllocations(expectedCoverId, segmentId, i);

      expect(segmentAllocationAfter.coverAmountInNXM).to.be.equal(
        segmentAllocationsBefore[i].coverAmountInNXM.sub(expectedBurnAmountPerPool),
      );
    }
  });
});