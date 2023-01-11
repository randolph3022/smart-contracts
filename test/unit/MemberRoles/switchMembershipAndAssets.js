const { ethers } = require('hardhat');
const { expect } = require('chai');
const { Role } = require('../utils').constants;

describe('switchMembershipAndAssets', function () {
  it('grants the member role to the new address', async function () {
    const { memberRoles, nxm } = this.contracts;
    const { members, nonMembers } = this.accounts;

    await nxm.connect(members[0]).approve(memberRoles.address, ethers.constants.MaxUint256);
    await memberRoles.connect(members[0]).switchMembershipAndAssets(nonMembers[0].address, [], []);
    const hasMemberRole = await memberRoles.checkRole(nonMembers[0].address, Role.Member);

    expect(hasMemberRole).to.be.equal(true);
  });

  it('removes the member role from the initial address', async function () {
    const { memberRoles, nxm } = this.contracts;
    const { members, nonMembers } = this.accounts;

    await nxm.connect(members[0]).approve(memberRoles.address, ethers.constants.MaxUint256);
    await memberRoles.connect(members[0]).switchMembershipAndAssets(nonMembers[0].address, [], []);
    const hasMemberRole = await memberRoles.checkRole(members[0].address, Role.Member);

    expect(hasMemberRole).to.be.equal(false);
  });

  it('whitelists the new address', async function () {
    const { memberRoles, nxm, tokenController } = this.contracts;
    const { members, nonMembers } = this.accounts;

    await nxm.connect(members[0]).approve(memberRoles.address, ethers.constants.MaxUint256);
    await memberRoles.connect(members[0]).switchMembershipAndAssets(nonMembers[0].address, [], []);
    const addToWhitelistLastCalledWtih = await tokenController.addToWhitelistLastCalledWtih();

    expect(addToWhitelistLastCalledWtih).to.be.equal(nonMembers[0].address);
  });

  it('removes the initial address from the whitelist', async function () {
    const { memberRoles, nxm, tokenController } = this.contracts;
    const { members, nonMembers } = this.accounts;

    await nxm.connect(members[0]).approve(memberRoles.address, ethers.constants.MaxUint256);
    await memberRoles.connect(members[0]).switchMembershipAndAssets(nonMembers[0].address, [], []);
    const removeFromWhitelistLastCalledWtih = await tokenController.removeFromWhitelistLastCalledWtih();

    expect(removeFromWhitelistLastCalledWtih).to.be.equal(members[0].address);
  });

  it('keeps the number of members the same', async function () {
    const { memberRoles, nxm } = this.contracts;
    const { members, nonMembers } = this.accounts;

    const membersBefore = await memberRoles.numberOfMembers(Role.Member);
    await nxm.connect(members[0]).approve(memberRoles.address, ethers.constants.MaxUint256);
    await memberRoles.connect(members[0]).switchMembershipAndAssets(nonMembers[0].address, [], []);
    const membersAfter = await memberRoles.numberOfMembers(Role.Member);

    expect(membersBefore).to.be.equal(membersAfter);
  });

  it('reverts when switching membership to another member address', async function () {
    const { memberRoles, nxm } = this.contracts;
    const { members } = this.accounts;

    await nxm.connect(members[0]).approve(memberRoles.address, ethers.constants.MaxUint256);
    await expect(
      memberRoles.connect(members[0]).switchMembershipAndAssets(members[1].address, [], []),
    ).to.be.revertedWith('The new address is already a member');
  });

  it('reverts when switching membership of non-member address', async function () {
    const { memberRoles, nxm } = this.contracts;
    const { nonMembers, members } = this.accounts;

    await nxm.connect(members[0]).approve(memberRoles.address, ethers.constants.MaxUint256);
    await expect(
      memberRoles.connect(nonMembers[0]).switchMembershipAndAssets(nonMembers[1].address, [], []),
    ).to.be.revertedWith('The current address is not a member');
  });

  it('transfers the NXM balance amount to the new address', async function () {
    const { memberRoles, nxm } = this.contracts;
    const { members, nonMembers } = this.accounts;

    const initialAddressBalance = await nxm.balanceOf(members[0].address);
    await nxm.connect(members[0]).approve(memberRoles.address, ethers.constants.MaxUint256);
    await memberRoles.connect(members[0]).switchMembershipAndAssets(nonMembers[0].address, [], []);
    const newAddressBalance = await nxm.balanceOf(nonMembers[0].address);

    expect(newAddressBalance).to.be.equal(initialAddressBalance);
  });
  it('transfers the provided covers to the new address', async function () {
    const { memberRoles, nxm, cover, coverNFT } = this.contracts;
    const [member] = this.accounts.members;
    const [nonMember] = this.accounts.nonMembers;

    for (let i = 0; i < 3; i++) {
      await cover.createMockCover(member.address, i);
    }

    await nxm.connect(member).approve(memberRoles.address, ethers.constants.MaxUint256);
    {
      const ownershipArr = await Promise.all([0, 1, 2].map(x => coverNFT.ownerOf(x)));
      expect(ownershipArr[0]).to.be.equal(member.address);
      expect(ownershipArr[1]).to.be.equal(member.address);
      expect(ownershipArr[2]).to.be.equal(member.address);
    }

    const newMemberAddress = nonMember.address;
    await memberRoles.connect(member).switchMembershipAndAssets(newMemberAddress, [0, 2], []);
    {
      const ownershipArr = await Promise.all([0, 1, 2].map(x => coverNFT.ownerOf(x)));
      expect(ownershipArr[0]).to.be.equal(newMemberAddress);
      expect(ownershipArr[1]).to.be.equal(member.address);
      expect(ownershipArr[2]).to.be.equal(newMemberAddress);
    }
  });

  it('transfers all staking NFTs to the new address', async function () {
    const { memberRoles, nxm, stakingNFT } = this.contracts;
    const [member, otherMember] = this.accounts.members;
    const [nonMember] = this.accounts.nonMembers;

    await stakingNFT.mint(member.address);
    await stakingNFT.mint(otherMember.address);
    await stakingNFT.mint(member.address);

    await nxm.connect(member).approve(memberRoles.address, ethers.constants.MaxUint256);

    const newMemberAddress = nonMember.address;
    const coverIds = [];
    const stakingNFTIds = [0, 2];
    await memberRoles.connect(member).switchMembershipAndAssets(newMemberAddress, coverIds, stakingNFTIds);

    // The given nfts should belong to the new address
    {
      const owner = await stakingNFT.ownerOf(0);
      expect(owner).to.be.equal(newMemberAddress);
    }
    {
      const owner = await stakingNFT.ownerOf(2);
      expect(owner).to.be.equal(newMemberAddress);
    }

    // The omitted nfts should belong to the initial address
    {
      const owner = await stakingNFT.ownerOf(1);
      expect(owner).to.be.equal(otherMember.address);
    }
  });

  it('reverts when trying to transfer staking nfts of another member', async function () {
    const { memberRoles, nxm, stakingNFT } = this.contracts;
    const [member, otherMember] = this.accounts.members;
    const [nonMember] = this.accounts.nonMembers;

    await stakingNFT.mint(otherMember.address);
    await stakingNFT.mint(member.address);
    await stakingNFT.mint(otherMember.address);

    await nxm.connect(member).approve(memberRoles.address, ethers.constants.MaxUint256);

    const newMemberAddress = nonMember.address;
    const coverIds = [];
    const stakingNFTIds = [0];
    await expect(
      memberRoles.connect(member).switchMembershipAndAssets(newMemberAddress, coverIds, stakingNFTIds),
    ).to.be.revertedWith('WRONG_FROM');
  });

  it('reverts when trying to transfer cover nfts of another member', async function () {
    const { memberRoles, nxm, cover } = this.contracts;
    const [member, otherMember] = this.accounts.members;
    const [nonMember] = this.accounts.nonMembers;

    for (let i = 0; i < 3; i++) {
      await cover.createMockCover(otherMember.address, i);
    }

    const newMemberAddress = nonMember.address;
    await nxm.connect(member).approve(memberRoles.address, ethers.constants.MaxUint256);
    await expect(
      memberRoles.connect(member).switchMembershipAndAssets(newMemberAddress, [0, 2], []),
    ).to.be.revertedWith('WRONG_FROM');
  });
});
