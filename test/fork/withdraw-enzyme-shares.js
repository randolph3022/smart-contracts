const { ethers, network } = require('hardhat');
const { expect } = require('chai');
const { parseEther, toUtf8Bytes } = ethers.utils;
const evm = require('./evm')();
const { enableAsEnzymeReceiver } = require('./utils');
const { toBytes8 } = require('../../lib/helpers');

const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const ENZYMEV4_VAULT_PROXY_ADDRESS = '0x27F23c710dD3d878FE9393d93465FeD1302f2EbD';
const ENZYME_FUND_VALUE_CALCULATOR_ROUTER = '0x7c728cd0CfA92401E01A4849a01b57EE53F5b2b9';
const COWSWAP_SETTLEMENT = '0x9008D19f58AAbD9eD0D60971565AA8510560ab41';
const ENZYMEV4_VAULT_PRICE_FEED_ORACLE_AGGREGATOR = '0xCc72039A141c6e34a779eF93AEF5eB4C82A893c7';

const V2Addresses = {
  SwapOperator: '0xcafea536d7f79F31Fa49bC40349f6a5F7E19D842',
};

const getSigner = async address => {
  const provider =
    network.name !== 'hardhat' // ethers errors out when using non-local accounts
      ? new ethers.providers.JsonRpcProvider(network.config.url)
      : ethers.provider;
  return provider.getSigner(address);
};

describe('prevent switch or withdraw membership when tokens are locked', function () {
  before(async function () {
    // Initialize evm helper
    await evm.connect(ethers.provider);
    await getSigner('0x1eE3ECa7aEF17D1e74eD7C447CcBA61aC76aDbA9');

    // Get or revert snapshot if network is tenderly
    if (network.name === 'tenderly') {
      const { TENDERLY_SNAPSHOT_ID } = process.env;
      if (TENDERLY_SNAPSHOT_ID) {
        await evm.revert(TENDERLY_SNAPSHOT_ID);
        console.log(`Reverted to snapshot ${TENDERLY_SNAPSHOT_ID}`);
      } else {
        console.log('Snapshot ID: ', await evm.snapshot());
      }
    }
  });

  it('load contracts', async function () {
    this.master = await ethers.getContractAt('NXMaster', '0x01BFd82675DBCc7762C84019cA518e701C0cD07e');
    this.swapOperator = await ethers.getContractAt('SwapOperator', V2Addresses.SwapOperator);

    this.pool = await ethers.getContractAt('Pool', await this.master.getLatestAddress(toUtf8Bytes('P1')));

    this.enzymeVaultShares = await ethers.getContractAt('ERC20Mock', ENZYMEV4_VAULT_PROXY_ADDRESS);

    this.enzymeSharesOracle = await ethers.getContractAt('Aggregator', ENZYMEV4_VAULT_PRICE_FEED_ORACLE_AGGREGATOR);

    const governanceAddress = await this.master.getLatestAddress(toUtf8Bytes('GV'));

    await evm.impersonate(governanceAddress);
    await evm.setBalance(governanceAddress, parseEther('1000'));
    this.governanceImpersonated = await getSigner(governanceAddress);
  });

  it('Upgrade SwapOperator', async function () {
    const swapControllerAddress = await this.swapOperator.swapController();

    const newSwapOperator = await ethers.deployContract('SwapOperator', [
      COWSWAP_SETTLEMENT,
      swapControllerAddress,
      this.master.address,
      WETH_ADDRESS,
      ENZYMEV4_VAULT_PROXY_ADDRESS,
      ENZYME_FUND_VALUE_CALCULATOR_ROUTER,
      '0',
    ]);

    await this.pool
      .connect(this.governanceImpersonated)
      .updateAddressParameters(toBytes8('SWP_OP'), newSwapOperator.address);

    this.swapOperator = await ethers.getContractAt('SwapOperator', newSwapOperator.address);
  });

  it('withdraw enzyme', async function () {
    const swapControllerAddress = await this.swapOperator.swapController();
    await evm.impersonate(swapControllerAddress);
    await evm.setBalance(swapControllerAddress, parseEther('1000'));
    const swapController = await getSigner(swapControllerAddress);

    const shareAmount = await this.enzymeVaultShares.balanceOf(this.pool.address);

    console.log({
      shareAmount: shareAmount.toString(),
    });

    await this.pool.connect(this.governanceImpersonated).setSwapDetails(
      ENZYMEV4_VAULT_PROXY_ADDRESS,
      '0',
      '1',
      '10000', // max slippage ratio
    );

    await enableAsEnzymeReceiver(this.swapOperator.address);

    const poolBalanceBefore = await ethers.provider.getBalance(this.pool.address);

    const swapAmount = shareAmount;

    const latestAnswer = await this.enzymeSharesOracle.latestAnswer();

    // Enzyme returns a few ethers under the oracle price currently
    const errorMargin = parseEther('25');

    const minOut = shareAmount.mul(latestAnswer).div(parseEther('1')).sub(errorMargin);

    await this.swapOperator.connect(swapController).swapEnzymeVaultShareForETH(swapAmount, minOut);

    const poolBalanceAfter = await ethers.provider.getBalance(this.pool.address);

    const poolBalanceIncrease = poolBalanceAfter.sub(poolBalanceBefore);

    console.log({
      poolBalanceIncrease: poolBalanceIncrease.toString(),
    });
    expect(poolBalanceIncrease).to.be.greaterThanOrEqual(minOut);
  });
});
