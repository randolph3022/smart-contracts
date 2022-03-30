// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.9;

import "../../external/cow/GPv2Order.sol";
import "@openzeppelin/contracts-v4/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-v4/utils/math/Math.sol";
import "../../interfaces/INXMMaster.sol";
import "../../interfaces/IPool.sol";
import "../../interfaces/IWeth.sol";
import "../../interfaces/ICowSettlement.sol";
import "../../interfaces/IPriceFeedOracle.sol";

contract CowSwapOperator {
  // Storage
  ICowSettlement public immutable cowSettlement;
  address public immutable cowVaultRelayer;
  INXMMaster public immutable master;
  address public immutable swapController;
  IWeth public immutable weth;
  IPriceFeedOracle public immutable priceFeedOracle;
  bytes public currentOrderUID;
  bytes32 public immutable domainSeparator;

  // Constants
  address public constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
  uint16 constant MAX_SLIPPAGE_DENOMINATOR = 10000;
  uint256 constant MIN_VALID_TO_PERIOD = 600; // 10 minutes
  uint256 constant MAX_VALID_TO_PERIOD = 3600; // 60 minutes
  uint256 constant MIN_SELL_AMT_TO_FEE_RATIO = 100; // Sell amount at least 100x fee amount

  event OrderPlaced(GPv2Order.Data order);
  event OrderClosed(GPv2Order.Data order, uint256 filledAmount);

  modifier onlyController() {
    require(msg.sender == swapController, "SwapOp: only controller can execute");
    _;
  }

  constructor(
    address _cowSettlement,
    address _swapController,
    address _master,
    address _weth,
    address _priceFeedOracle
  ) {
    cowSettlement = ICowSettlement(_cowSettlement);
    cowVaultRelayer = cowSettlement.vaultRelayer();
    master = INXMMaster(_master);
    swapController = _swapController;
    weth = IWeth(_weth);
    priceFeedOracle = IPriceFeedOracle(_priceFeedOracle);
    domainSeparator = cowSettlement.domainSeparator();
  }

  receive() external payable {}

  function getDigest(GPv2Order.Data calldata order) public view returns (bytes32) {
    bytes32 hash = GPv2Order.hash(order, domainSeparator);
    return hash;
  }

  function getUID(GPv2Order.Data calldata order) public view returns (bytes memory) {
    bytes memory uid = new bytes(56);
    bytes32 digest = getDigest(order);
    GPv2Order.packOrderUidParams(uid, digest, order.receiver, order.validTo);
    return uid;
  }

  function placeOrder(GPv2Order.Data calldata order, bytes calldata orderUID) public onlyController {
    // Validate there's no current order going on
    require(currentOrderUID.length == 0, "SwapOp: an order is already in place");

    // Order UID verification
    validateUID(order, orderUID);

    // Validate basic CoW params
    validateBasicCowParams(order);

    // Validate feeAmount is not too high
    require(order.sellAmount / order.feeAmount >= MIN_SELL_AMT_TO_FEE_RATIO, "SwapOp: Fee is above 1% of sellAmount");

    // Local variables
    IPool pool = _pool();
    uint256 totalOutAmount = order.sellAmount + order.feeAmount;

    if (isSellingEth(order)) {
      // Validate min/max setup for buyToken
      IPool.SwapDetails memory swapDetails = pool.getAssetSwapDetails(address(order.buyToken));
      require(swapDetails.minAmount != 0 || swapDetails.maxAmount != 0, "SwapOp: buyToken is not enabled");
      uint256 buyTokenBalance = order.buyToken.balanceOf(address(pool));
      require(buyTokenBalance < swapDetails.minAmount, "SwapOp: can only buy asset when < minAmount");
      require(buyTokenBalance + order.buyAmount <= swapDetails.maxAmount, "SwapOp: swap brings buyToken above max");
      require(buyTokenBalance + order.buyAmount >= swapDetails.minAmount, "SwapOp: swap leaves buyToken below min");

      // Validate minimum pool eth reserve
      require(address(pool).balance - totalOutAmount >= pool.minPoolEth(), "SwapOp: Pool eth balance below min");

      // Ask oracle how much of the other asset we should get
      uint256 oracleBuyAmount = priceFeedOracle.getAssetForEth(address(order.buyToken), order.sellAmount);

      // Calculate slippage and minimum amount we should accept
      uint256 maxSlippageAmount = (oracleBuyAmount * swapDetails.maxSlippageRatio) / MAX_SLIPPAGE_DENOMINATOR;
      uint256 minBuyAmountOnMaxSlippage = oracleBuyAmount - maxSlippageAmount;

      require(order.buyAmount >= minBuyAmountOnMaxSlippage, "SwapOp: order.buyAmount too low (oracle)");

      // Transfer ETH from pool and wrap it
      pool.transferAssetToSwapOperator(ETH, totalOutAmount);
      weth.deposit{value: totalOutAmount}();

      // Set pool's swapValue
      pool.setSwapValue(totalOutAmount);
    } else if (isBuyingEth(order)) {
      // Validate min/max setup for sellToken
      IPool.SwapDetails memory swapDetails = pool.getAssetSwapDetails(address(order.sellToken));
      require(swapDetails.minAmount != 0 || swapDetails.maxAmount != 0, "SwapOp: sellToken is not enabled");
      uint256 sellTokenBalance = order.sellToken.balanceOf(address(pool));
      require(sellTokenBalance > swapDetails.maxAmount, "SwapOp: can only sell asset when > maxAmount");
      require(sellTokenBalance - totalOutAmount >= swapDetails.minAmount, "SwapOp: swap brings sellToken below min");
      require(sellTokenBalance - totalOutAmount <= swapDetails.maxAmount, "SwapOp: swap leaves sellToken above max");

      // Ask oracle how much ether we should get
      uint256 oracleBuyAmount = priceFeedOracle.getEthForAsset(address(order.sellToken), order.sellAmount);

      // Calculate slippage and minimum amount we should accept
      uint256 maxSlippageAmount = (oracleBuyAmount * swapDetails.maxSlippageRatio) / MAX_SLIPPAGE_DENOMINATOR;
      uint256 minBuyAmountOnMaxSlippage = oracleBuyAmount - maxSlippageAmount;
      require(order.buyAmount >= minBuyAmountOnMaxSlippage, "SwapOp: order.buyAmount too low (oracle)");

      // Transfer ERC20 asset from Pool
      pool.transferAssetToSwapOperator(address(order.sellToken), totalOutAmount);

      // Calculate swapValue using oracle and set it on the pool
      uint256 swapValue = priceFeedOracle.getEthForAsset(address(order.sellToken), totalOutAmount);
      pool.setSwapValue(swapValue);
    } else {
      revert("SwapOp: Must either sell or buy eth");
    }

    // Approve Cow's contract to spend sellToken
    approveVaultRelayer(order.sellToken, totalOutAmount);

    // Store the order UID
    currentOrderUID = orderUID;

    // Sign the Cow order
    cowSettlement.setPreSignature(orderUID, true);

    // Emit an event
    emit OrderPlaced(order);
  }

  function closeOrder(GPv2Order.Data calldata order) external {
    // Validate there is an order in place
    require(currentOrderUID.length > 0, "SwapOp: No order in place");

    // Before validTo, only controller can call this. After it, everyone can call
    if (block.timestamp <= order.validTo) {
      require(msg.sender == swapController, "SwapOp: only controller can execute");
    }

    validateUID(order, currentOrderUID);

    // Check how much of the order was filled, and if it was fully filled
    uint256 filledAmount = cowSettlement.filledAmount(currentOrderUID);
    bool fullyFilled = filledAmount == order.sellAmount;

    // Cancel signature and unapprove tokens
    if (!fullyFilled) {
      cowSettlement.setPreSignature(currentOrderUID, false);
      approveVaultRelayer(order.sellToken, 0);
    }

    // Clear the current order
    delete currentOrderUID;

    // Withdraw both buyToken and sellToken
    returnAssetToPool(order.buyToken);
    returnAssetToPool(order.sellToken);

    // Set swapValue on pool to 0
    _pool().setSwapValue(0);

    // Emit event
    emit OrderClosed(order, filledAmount);
  }

  function returnAssetToPool(IERC20 asset) internal {
    uint256 balance = asset.balanceOf(address(this));

    if (balance == 0) {
      return;
    }

    if (address(asset) == address(weth)) {
      weth.withdraw(balance); // Unwrap WETH
      payable(address(_pool())).transfer(balance); // Transfer ETH to pool
    } else {
      asset.transfer(address(_pool()), balance); // Transfer ERC20 to pool
    }
  }

  function isSellingEth(GPv2Order.Data calldata order) internal view returns (bool) {
    return address(order.sellToken) == address(weth);
  }

  function isBuyingEth(GPv2Order.Data calldata order) internal view returns (bool) {
    return address(order.buyToken) == address(weth);
  }

  function validateBasicCowParams(GPv2Order.Data calldata order) internal view {
    require(order.sellTokenBalance == GPv2Order.BALANCE_ERC20, "SwapOp: Only erc20 supported for sellTokenBalance");
    require(order.buyTokenBalance == GPv2Order.BALANCE_ERC20, "SwapOp: Only erc20 supported for buyTokenBalance");
    require(order.receiver == address(this), "SwapOp: Receiver must be this contract");
    require(
      order.validTo >= block.timestamp + MIN_VALID_TO_PERIOD,
      "SwapOp: validTo must be at least 10 minutes in the future"
    );
    require(
      order.validTo <= block.timestamp + MAX_VALID_TO_PERIOD,
      "SwapOp: validTo must be at most 60 minutes in the future"
    );
  }

  function approveVaultRelayer(IERC20 token, uint256 amount) internal {
    token.approve(cowVaultRelayer, amount); // infinite approval
  }

  function validateUID(GPv2Order.Data calldata order, bytes memory providedOrderUID) internal view {
    bytes memory calculatedUID = getUID(order);
    require(
      keccak256(calculatedUID) == keccak256(providedOrderUID),
      "SwapOp: Provided UID doesnt match calculated UID"
    );
  }

  function _pool() internal view returns (IPool) {
    return IPool(master.getLatestAddress("P1"));
  }
}
