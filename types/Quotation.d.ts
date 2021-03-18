/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import BN from "bn.js";
import { EventData, PastEventOptions } from "web3-eth-contract";

export interface QuotationContract extends Truffle.Contract<QuotationInstance> {
  "new"(meta?: Truffle.TransactionDetails): Promise<QuotationInstance>;
}

export interface RefundEvent {
  name: "RefundEvent";
  args: {
    user: string;
    status: boolean;
    holdedCoverID: BN;
    reason: string;
    0: string;
    1: boolean;
    2: BN;
    3: string;
  };
}

type AllEvents = RefundEvent;

export interface QuotationInstance extends Truffle.ContractInstance {
  changeDependentContractAddress: {
    (txDetails?: Truffle.TransactionDetails): Promise<
      Truffle.TransactionResponse<AllEvents>
    >;
    call(txDetails?: Truffle.TransactionDetails): Promise<void>;
    sendTransaction(txDetails?: Truffle.TransactionDetails): Promise<string>;
    estimateGas(txDetails?: Truffle.TransactionDetails): Promise<number>;
  };

  changeMasterAddress: {
    (_masterAddress: string, txDetails?: Truffle.TransactionDetails): Promise<
      Truffle.TransactionResponse<AllEvents>
    >;
    call(
      _masterAddress: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      _masterAddress: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      _masterAddress: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  cr(txDetails?: Truffle.TransactionDetails): Promise<string>;

  expireCover: {
    (
      coverId: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      coverId: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      coverId: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      coverId: number | BN | string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  getOrderHash(
    coverDetails: (number | BN | string)[],
    coverPeriod: number | BN | string,
    curr: string,
    smaratCA: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<string>;

  getWithdrawableCoverNoteCoverIds(
    coverOwner: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<[BN[], string[]]>;

  isValidSignature(
    hash: string,
    v: number | BN | string,
    r: string,
    s: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<boolean>;

  kycVerdict: {
    (
      _add: string,
      status: boolean,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      _add: string,
      status: boolean,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      _add: string,
      status: boolean,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      _add: string,
      status: boolean,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  m1(txDetails?: Truffle.TransactionDetails): Promise<string>;

  makeCoverUsingNXMTokens: {
    (
      coverDetails: (number | BN | string)[],
      coverPeriod: number | BN | string,
      coverCurr: string,
      smartCAdd: string,
      _v: number | BN | string,
      _r: string,
      _s: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      coverDetails: (number | BN | string)[],
      coverPeriod: number | BN | string,
      coverCurr: string,
      smartCAdd: string,
      _v: number | BN | string,
      _r: string,
      _s: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      coverDetails: (number | BN | string)[],
      coverPeriod: number | BN | string,
      coverCurr: string,
      smartCAdd: string,
      _v: number | BN | string,
      _r: string,
      _s: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      coverDetails: (number | BN | string)[],
      coverPeriod: number | BN | string,
      coverCurr: string,
      smartCAdd: string,
      _v: number | BN | string,
      _r: string,
      _s: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  mr(txDetails?: Truffle.TransactionDetails): Promise<string>;

  ms(txDetails?: Truffle.TransactionDetails): Promise<string>;

  nxMasterAddress(txDetails?: Truffle.TransactionDetails): Promise<string>;

  pd(txDetails?: Truffle.TransactionDetails): Promise<string>;

  pool(txDetails?: Truffle.TransactionDetails): Promise<string>;

  qd(txDetails?: Truffle.TransactionDetails): Promise<string>;

  sendEther: {
    (txDetails?: Truffle.TransactionDetails): Promise<
      Truffle.TransactionResponse<AllEvents>
    >;
    call(txDetails?: Truffle.TransactionDetails): Promise<void>;
    sendTransaction(txDetails?: Truffle.TransactionDetails): Promise<string>;
    estimateGas(txDetails?: Truffle.TransactionDetails): Promise<number>;
  };

  tc(txDetails?: Truffle.TransactionDetails): Promise<string>;

  td(txDetails?: Truffle.TransactionDetails): Promise<string>;

  tf(txDetails?: Truffle.TransactionDetails): Promise<string>;

  transferAssetsToNewContract: {
    (newAdd: string, txDetails?: Truffle.TransactionDetails): Promise<
      Truffle.TransactionResponse<AllEvents>
    >;
    call(newAdd: string, txDetails?: Truffle.TransactionDetails): Promise<void>;
    sendTransaction(
      newAdd: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      newAdd: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  verifyCoverDetails: {
    (
      from: string,
      scAddress: string,
      coverCurr: string,
      coverDetails: (number | BN | string)[],
      coverPeriod: number | BN | string,
      _v: number | BN | string,
      _r: string,
      _s: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      from: string,
      scAddress: string,
      coverCurr: string,
      coverDetails: (number | BN | string)[],
      coverPeriod: number | BN | string,
      _v: number | BN | string,
      _r: string,
      _s: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      from: string,
      scAddress: string,
      coverCurr: string,
      coverDetails: (number | BN | string)[],
      coverPeriod: number | BN | string,
      _v: number | BN | string,
      _r: string,
      _s: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      from: string,
      scAddress: string,
      coverCurr: string,
      coverDetails: (number | BN | string)[],
      coverPeriod: number | BN | string,
      _v: number | BN | string,
      _r: string,
      _s: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  verifySign(
    coverDetails: (number | BN | string)[],
    coverPeriod: number | BN | string,
    curr: string,
    smaratCA: string,
    _v: number | BN | string,
    _r: string,
    _s: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<boolean>;

  withdrawCoverNote: {
    (
      coverOwner: string,
      coverIds: (number | BN | string)[],
      reasonIndexes: (number | BN | string)[],
      txDetails?: Truffle.TransactionDetails
    ): Promise<Truffle.TransactionResponse<AllEvents>>;
    call(
      coverOwner: string,
      coverIds: (number | BN | string)[],
      reasonIndexes: (number | BN | string)[],
      txDetails?: Truffle.TransactionDetails
    ): Promise<void>;
    sendTransaction(
      coverOwner: string,
      coverIds: (number | BN | string)[],
      reasonIndexes: (number | BN | string)[],
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
    estimateGas(
      coverOwner: string,
      coverIds: (number | BN | string)[],
      reasonIndexes: (number | BN | string)[],
      txDetails?: Truffle.TransactionDetails
    ): Promise<number>;
  };

  methods: {
    changeDependentContractAddress: {
      (txDetails?: Truffle.TransactionDetails): Promise<
        Truffle.TransactionResponse<AllEvents>
      >;
      call(txDetails?: Truffle.TransactionDetails): Promise<void>;
      sendTransaction(txDetails?: Truffle.TransactionDetails): Promise<string>;
      estimateGas(txDetails?: Truffle.TransactionDetails): Promise<number>;
    };

    changeMasterAddress: {
      (_masterAddress: string, txDetails?: Truffle.TransactionDetails): Promise<
        Truffle.TransactionResponse<AllEvents>
      >;
      call(
        _masterAddress: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        _masterAddress: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        _masterAddress: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    cr(txDetails?: Truffle.TransactionDetails): Promise<string>;

    expireCover: {
      (
        coverId: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        coverId: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        coverId: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        coverId: number | BN | string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    getOrderHash(
      coverDetails: (number | BN | string)[],
      coverPeriod: number | BN | string,
      curr: string,
      smaratCA: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;

    getWithdrawableCoverNoteCoverIds(
      coverOwner: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<[BN[], string[]]>;

    isValidSignature(
      hash: string,
      v: number | BN | string,
      r: string,
      s: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<boolean>;

    kycVerdict: {
      (
        _add: string,
        status: boolean,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        _add: string,
        status: boolean,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        _add: string,
        status: boolean,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        _add: string,
        status: boolean,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    m1(txDetails?: Truffle.TransactionDetails): Promise<string>;

    makeCoverUsingNXMTokens: {
      (
        coverDetails: (number | BN | string)[],
        coverPeriod: number | BN | string,
        coverCurr: string,
        smartCAdd: string,
        _v: number | BN | string,
        _r: string,
        _s: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        coverDetails: (number | BN | string)[],
        coverPeriod: number | BN | string,
        coverCurr: string,
        smartCAdd: string,
        _v: number | BN | string,
        _r: string,
        _s: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        coverDetails: (number | BN | string)[],
        coverPeriod: number | BN | string,
        coverCurr: string,
        smartCAdd: string,
        _v: number | BN | string,
        _r: string,
        _s: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        coverDetails: (number | BN | string)[],
        coverPeriod: number | BN | string,
        coverCurr: string,
        smartCAdd: string,
        _v: number | BN | string,
        _r: string,
        _s: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    mr(txDetails?: Truffle.TransactionDetails): Promise<string>;

    ms(txDetails?: Truffle.TransactionDetails): Promise<string>;

    nxMasterAddress(txDetails?: Truffle.TransactionDetails): Promise<string>;

    pd(txDetails?: Truffle.TransactionDetails): Promise<string>;

    pool(txDetails?: Truffle.TransactionDetails): Promise<string>;

    qd(txDetails?: Truffle.TransactionDetails): Promise<string>;

    sendEther: {
      (txDetails?: Truffle.TransactionDetails): Promise<
        Truffle.TransactionResponse<AllEvents>
      >;
      call(txDetails?: Truffle.TransactionDetails): Promise<void>;
      sendTransaction(txDetails?: Truffle.TransactionDetails): Promise<string>;
      estimateGas(txDetails?: Truffle.TransactionDetails): Promise<number>;
    };

    tc(txDetails?: Truffle.TransactionDetails): Promise<string>;

    td(txDetails?: Truffle.TransactionDetails): Promise<string>;

    tf(txDetails?: Truffle.TransactionDetails): Promise<string>;

    transferAssetsToNewContract: {
      (newAdd: string, txDetails?: Truffle.TransactionDetails): Promise<
        Truffle.TransactionResponse<AllEvents>
      >;
      call(
        newAdd: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        newAdd: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        newAdd: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    verifyCoverDetails: {
      (
        from: string,
        scAddress: string,
        coverCurr: string,
        coverDetails: (number | BN | string)[],
        coverPeriod: number | BN | string,
        _v: number | BN | string,
        _r: string,
        _s: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        from: string,
        scAddress: string,
        coverCurr: string,
        coverDetails: (number | BN | string)[],
        coverPeriod: number | BN | string,
        _v: number | BN | string,
        _r: string,
        _s: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        from: string,
        scAddress: string,
        coverCurr: string,
        coverDetails: (number | BN | string)[],
        coverPeriod: number | BN | string,
        _v: number | BN | string,
        _r: string,
        _s: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        from: string,
        scAddress: string,
        coverCurr: string,
        coverDetails: (number | BN | string)[],
        coverPeriod: number | BN | string,
        _v: number | BN | string,
        _r: string,
        _s: string,
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };

    verifySign(
      coverDetails: (number | BN | string)[],
      coverPeriod: number | BN | string,
      curr: string,
      smaratCA: string,
      _v: number | BN | string,
      _r: string,
      _s: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<boolean>;

    withdrawCoverNote: {
      (
        coverOwner: string,
        coverIds: (number | BN | string)[],
        reasonIndexes: (number | BN | string)[],
        txDetails?: Truffle.TransactionDetails
      ): Promise<Truffle.TransactionResponse<AllEvents>>;
      call(
        coverOwner: string,
        coverIds: (number | BN | string)[],
        reasonIndexes: (number | BN | string)[],
        txDetails?: Truffle.TransactionDetails
      ): Promise<void>;
      sendTransaction(
        coverOwner: string,
        coverIds: (number | BN | string)[],
        reasonIndexes: (number | BN | string)[],
        txDetails?: Truffle.TransactionDetails
      ): Promise<string>;
      estimateGas(
        coverOwner: string,
        coverIds: (number | BN | string)[],
        reasonIndexes: (number | BN | string)[],
        txDetails?: Truffle.TransactionDetails
      ): Promise<number>;
    };
  };

  getPastEvents(event: string): Promise<EventData[]>;
  getPastEvents(
    event: string,
    options: PastEventOptions,
    callback: (error: Error, event: EventData) => void
  ): Promise<EventData[]>;
  getPastEvents(event: string, options: PastEventOptions): Promise<EventData[]>;
  getPastEvents(
    event: string,
    callback: (error: Error, event: EventData) => void
  ): Promise<EventData[]>;
}
