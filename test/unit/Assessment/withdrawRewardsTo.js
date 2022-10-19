const { ethers } = require('hardhat');
const { expect } = require('chai');
const { setTime } = require('./helpers');

const { parseEther } = ethers.utils;
const daysToSeconds = days => days * 24 * 60 * 60;

describe('withdrawRewardsTo', function () {
  it('reverts if there are no withdrawable rewards', async function () {
    const { assessment } = this.contracts;
    const [user] = this.accounts.members;
    await assessment.connect(user).stake(parseEther('10'));
    expect(assessment.connect(user).withdrawRewardsTo(user.address, 0)).to.be.revertedWith('No withdrawable rewards');
  });

  it('reverts when not called by the owner of the rewards ', async function () {
    const { nxm, assessment, individualClaims } = this.contracts;
    const [staker] = this.accounts.members;
    const { minVotingPeriodInDays, payoutCooldownInDays } = await assessment.config();
    await assessment.connect(staker).stake(parseEther('10'));

    await individualClaims.connect(staker).submitClaim(0, 0, parseEther('100'), '');
    await assessment.connect(staker).castVotes([0], [true], 0);
    const { timestamp } = await ethers.provider.getBlock('latest');
    await setTime(timestamp + daysToSeconds(minVotingPeriodInDays + payoutCooldownInDays));

    const [nonMember] = this.accounts.nonMembers;
    const { totalRewardInNXM } = await assessment.assessments(0);
    const nonMemberBalanceBefore = await nxm.balanceOf(nonMember.address);
    const stakerBalanceBefore = await nxm.balanceOf(staker.address);
    await expect(
      assessment.connect(nonMember).withdrawRewardsTo(staker.address, 0, { gasPrice: 0 }),
    ).to.be.revertedWith('No withdrawable rewards');
    await expect(assessment.connect(staker).withdrawRewardsTo(staker.address, 0, { gasPrice: 0 })).not.to.be.reverted;
    const nonMemberBalanceAfter = await nxm.balanceOf(nonMember.address);
    const stakerBalanceAfter = await nxm.balanceOf(staker.address);
    expect(nonMemberBalanceAfter).to.be.equal(nonMemberBalanceBefore);
    expect(stakerBalanceAfter).to.be.equal(stakerBalanceBefore.add(totalRewardInNXM));
  });

  it('sends the rewards to any member address', async function () {
    const { nxm, assessment, individualClaims } = this.contracts;
    const [staker, otherMember] = this.accounts.members;
    const { minVotingPeriodInDays, payoutCooldownInDays } = await assessment.config();
    await assessment.connect(staker).stake(parseEther('10'));

    await individualClaims.connect(staker).submitClaim(0, 0, parseEther('100'), '');
    await assessment.connect(staker).castVotes([0], [true], 0);
    const { timestamp } = await ethers.provider.getBlock('latest');
    await setTime(timestamp + daysToSeconds(minVotingPeriodInDays + payoutCooldownInDays));

    const { totalRewardInNXM } = await assessment.assessments(0);
    const nonMemberBalanceBefore = await nxm.balanceOf(staker.address);
    const stakerBalanceBefore = await nxm.balanceOf(otherMember.address);
    await expect(assessment.connect(staker).withdrawRewardsTo(otherMember.address, 0, { gasPrice: 0 })).not.to.be
      .reverted;
    const nonMemberBalanceAfter = await nxm.balanceOf(staker.address);
    const stakerBalanceAfter = await nxm.balanceOf(otherMember.address);
    expect(nonMemberBalanceAfter).to.be.equal(nonMemberBalanceBefore);
    expect(stakerBalanceAfter).to.be.equal(stakerBalanceBefore.add(totalRewardInNXM));
  });

  it('withdraws rewards up to the last finalized assessment when an unfinalized assessment follows', async function () {
    const { nxm, assessment, individualClaims } = this.contracts;
    const [user] = this.accounts.members;
    const { minVotingPeriodInDays, payoutCooldownInDays } = await assessment.config();
    await assessment.connect(user).stake(parseEther('10'));

    await individualClaims.connect(user).submitClaim(0, 0, parseEther('100'), '');
    await assessment.connect(user).castVotes([0], [true], 0);
    const { timestamp } = await ethers.provider.getBlock('latest');
    await setTime(timestamp + daysToSeconds(minVotingPeriodInDays + payoutCooldownInDays));

    await individualClaims.connect(user).submitClaim(1, 0, parseEther('100'), '');
    await assessment.connect(user).castVotes([1], [true], 0);

    await individualClaims.connect(user).submitClaim(2, 0, parseEther('100'), '');
    await assessment.connect(user).castVotes([2], [true], 0);

    const balanceBefore = await nxm.balanceOf(user.address);

    await assessment.connect(user).withdrawRewardsTo(user.address, 0);
    const { rewardsWithdrawableFromIndex } = await assessment.stakeOf(user.address);
    expect(rewardsWithdrawableFromIndex).to.be.equal(1);

    const { totalRewardInNXM } = await assessment.assessments(0);
    const balanceAfter = await nxm.balanceOf(user.address);
    expect(balanceAfter).to.be.equal(balanceBefore.add(totalRewardInNXM));
  });

  it("mints rewards based on user's stake at vote time", async function () {
    const { nxm, assessment, individualClaims } = this.contracts;
    const [user1, user2, user3] = this.accounts.members;
    const { minVotingPeriodInDays, payoutCooldownInDays } = await assessment.config();

    {
      await individualClaims.connect(user1).submitClaim(0, 0, parseEther('100'), '');
      await assessment.connect(user1).stake(parseEther('10'));
      await assessment.connect(user2).stake(parseEther('10'));
      await assessment.connect(user3).stake(parseEther('10'));

      await assessment.connect(user1).castVotes([0], [true], 0);
      await assessment.connect(user2).castVotes([0], [true], 0);
      await assessment.connect(user3).castVotes([0], [true], 0);
      const { totalRewardInNXM } = await assessment.assessments(0);

      const { timestamp } = await ethers.provider.getBlock('latest');
      await setTime(timestamp + daysToSeconds(minVotingPeriodInDays + payoutCooldownInDays));

      {
        const balanceBefore = await nxm.balanceOf(user1.address);
        await assessment.connect(user1).withdrawRewardsTo(user1.address, 0);
        const balanceAfter = await nxm.balanceOf(user1.address);
        expect(balanceAfter).to.be.equal(balanceBefore.add(totalRewardInNXM.div(3)));
      }

      {
        const balanceBefore = await nxm.balanceOf(user2.address);
        await assessment.connect(user2).withdrawRewardsTo(user2.address, 0);
        const balanceAfter = await nxm.balanceOf(user2.address);
        expect(balanceAfter).to.be.equal(balanceBefore.add(totalRewardInNXM.div(3)));
      }

      {
        const balanceBefore = await nxm.balanceOf(user3.address);
        await assessment.connect(user3).withdrawRewardsTo(user3.address, 0);
        const balanceAfter = await nxm.balanceOf(user3.address);
        expect(balanceAfter).to.be.equal(balanceBefore.add(totalRewardInNXM.div(3)));
      }
    }

    {
      await individualClaims.connect(user1).submitClaim(1, 0, parseEther('100'), '');

      await assessment.connect(user1).castVotes([1], [true], 0);
      await assessment.connect(user2).castVotes([1], [true], 0);
      const { totalRewardInNXM } = await assessment.assessments(1);

      const { timestamp } = await ethers.provider.getBlock('latest');
      await setTime(timestamp + daysToSeconds(minVotingPeriodInDays + payoutCooldownInDays));

      {
        const balanceBefore = await nxm.balanceOf(user1.address);
        await assessment.connect(user1).withdrawRewardsTo(user1.address, 0);
        const balanceAfter = await nxm.balanceOf(user1.address);
        expect(balanceAfter).to.be.equal(balanceBefore.add(totalRewardInNXM.div(2)));
      }

      {
        const balanceBefore = await nxm.balanceOf(user2.address);
        await assessment.connect(user2).withdrawRewardsTo(user2.address, 0);
        const balanceAfter = await nxm.balanceOf(user2.address);
        expect(balanceAfter).to.be.equal(balanceBefore.add(totalRewardInNXM.div(2)));
      }
    }

    {
      await individualClaims.connect(user1).submitClaim(2, 0, parseEther('100'), '');
      await assessment.connect(user1).stake(parseEther('10'));
      await assessment.connect(user2).stake(parseEther('27'));
      await assessment.connect(user3).stake(parseEther('33'));

      await assessment.connect(user1).castVotes([2], [true], 0);
      await assessment.connect(user2).castVotes([2], [true], 0);
      await assessment.connect(user3).castVotes([2], [true], 0);
      const { totalRewardInNXM } = await assessment.assessments(2);

      const { timestamp } = await ethers.provider.getBlock('latest');
      await setTime(timestamp + daysToSeconds(minVotingPeriodInDays + payoutCooldownInDays));

      {
        const balanceBefore = await nxm.balanceOf(user1.address);
        await assessment.connect(user1).withdrawRewardsTo(user1.address, 0);
        const balanceAfter = await nxm.balanceOf(user1.address);
        expect(balanceAfter).to.be.equal(balanceBefore.add(totalRewardInNXM.mul(20).div(100)));
      }

      {
        const balanceBefore = await nxm.balanceOf(user2.address);
        await assessment.connect(user2).withdrawRewardsTo(user2.address, 0);
        const balanceAfter = await nxm.balanceOf(user2.address);
        expect(balanceAfter).to.be.equal(balanceBefore.add(totalRewardInNXM.mul(37).div(100)));
      }

      {
        const balanceBefore = await nxm.balanceOf(user3.address);
        await assessment.connect(user3).withdrawRewardsTo(user3.address, 0);
        const balanceAfter = await nxm.balanceOf(user3.address);
        expect(balanceAfter).to.be.equal(balanceBefore.add(totalRewardInNXM.mul(43).div(100)));
      }
    }
  });

  it('reverts if the destination address is not a member', async function () {
    const { assessment, individualClaims } = this.contracts;
    const [user1] = this.accounts.members;
    const nonMember = '0xDECAF00000000000000000000000000000000000';
    const { minVotingPeriodInDays, payoutCooldownInDays } = await assessment.config();
    {
      await individualClaims.connect(user1).submitClaim(0, 0, parseEther('100'), '');
      await assessment.connect(user1).stake(parseEther('10'));
      await assessment.connect(user1).castVotes([0], [true], 0);

      const { timestamp } = await ethers.provider.getBlock('latest');
      await setTime(timestamp + daysToSeconds(minVotingPeriodInDays + payoutCooldownInDays));

      await expect(assessment.connect(user1).withdrawRewardsTo(nonMember, 0)).to.be.revertedWith(
        'Destination address is not a member',
      );
    }
  });

  it('should withdraw multiple rewards consecutively', async function () {
    const { nxm, assessment, individualClaims } = this.contracts;
    const [user1] = this.accounts.members;
    const { minVotingPeriodInDays, payoutCooldownInDays } = await assessment.config();

    {
      await individualClaims.connect(user1).submitClaim(0, 0, parseEther('100'), '');
      await individualClaims.connect(user1).submitClaim(1, 0, parseEther('100'), '');
      await individualClaims.connect(user1).submitClaim(2, 0, parseEther('100'), '');
      await assessment.connect(user1).stake(parseEther('10'));
      await assessment.connect(user1).castVotes([0, 1, 2], [true, true, true], 0);

      const { totalRewardInNXM } = await assessment.assessments(0);

      const { timestamp } = await ethers.provider.getBlock('latest');
      await setTime(timestamp + daysToSeconds(minVotingPeriodInDays + payoutCooldownInDays));

      {
        const balanceBefore = await nxm.balanceOf(user1.address);
        await assessment.connect(user1).withdrawRewardsTo(user1.address, 1);
        const balanceAfter = await nxm.balanceOf(user1.address);
        expect(balanceAfter.sub(balanceBefore)).to.be.equal(totalRewardInNXM);
      }
      {
        const balanceBefore = await nxm.balanceOf(user1.address);
        await assessment.connect(user1).withdrawRewardsTo(user1.address, 1);
        const balanceAfter = await nxm.balanceOf(user1.address);
        expect(balanceAfter).to.be.equal(balanceBefore.add(totalRewardInNXM));
      }
      {
        const balanceBefore = await nxm.balanceOf(user1.address);
        await assessment.connect(user1).withdrawRewardsTo(user1.address, 1);
        const balanceAfter = await nxm.balanceOf(user1.address);
        expect(balanceAfter).to.be.equal(balanceBefore.add(totalRewardInNXM));
      }
    }
  });

  it('should withdraw multiple rewards in one tx', async function () {
    const { nxm, assessment, individualClaims } = this.contracts;
    const [user1] = this.accounts.members;
    const { minVotingPeriodInDays, payoutCooldownInDays } = await assessment.config();

    {
      await individualClaims.connect(user1).submitClaim(0, 0, parseEther('100'), '');
      await individualClaims.connect(user1).submitClaim(1, 0, parseEther('100'), '');
      await individualClaims.connect(user1).submitClaim(2, 0, parseEther('100'), '');
      await assessment.connect(user1).stake(parseEther('10'));
      await assessment.connect(user1).castVotes([0, 1, 2], [true, true, true], 0);

      const { totalRewardInNXM } = await assessment.assessments(0);

      const { timestamp } = await ethers.provider.getBlock('latest');
      await setTime(timestamp + daysToSeconds(minVotingPeriodInDays + payoutCooldownInDays));

      {
        const balanceBefore = await nxm.balanceOf(user1.address);
        await assessment.connect(user1).withdrawRewardsTo(user1.address, 0);
        const balanceAfter = await nxm.balanceOf(user1.address);
        expect(balanceAfter.sub(balanceBefore)).to.be.equal(totalRewardInNXM.mul(3));
      }
    }
  });

  it('emits RewardWithdrawn event with staker and withdrawn amount', async function () {
    const { assessment, individualClaims } = this.contracts;
    const [staker, user1] = this.accounts.members;
    const { minVotingPeriodInDays, payoutCooldownInDays } = await assessment.config();
    await assessment.connect(staker).stake(parseEther('10'));

    await individualClaims.connect(staker).submitClaim(0, 0, parseEther('100'), '');
    await assessment.connect(staker).castVotes([0], [true], 0);
    const { totalRewardInNXM } = await assessment.assessments(0);

    const { timestamp } = await ethers.provider.getBlock('latest');
    await setTime(timestamp + daysToSeconds(minVotingPeriodInDays + payoutCooldownInDays));

    await expect(assessment.connect(staker).withdrawRewardsTo(user1.address, 0))
      .to.emit(assessment, 'RewardWithdrawn')
      .withArgs(staker.address, totalRewardInNXM);
  });
});
