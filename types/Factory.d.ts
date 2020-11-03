/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import BN from "bn.js";
import { EventData, PastEventOptions } from "web3-eth-contract";

export interface FactoryContract extends Truffle.Contract<FactoryInstance> {
  "new"(meta?: Truffle.TransactionDetails): Promise<FactoryInstance>;
}

type AllEvents = never;

export interface FactoryInstance extends Truffle.ContractInstance {
  getExchange(
    token: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<string>;

  getToken(
    exchange: string,
    txDetails?: Truffle.TransactionDetails
  ): Promise<string>;

  methods: {
    getExchange(
      token: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;

    getToken(
      exchange: string,
      txDetails?: Truffle.TransactionDetails
    ): Promise<string>;
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