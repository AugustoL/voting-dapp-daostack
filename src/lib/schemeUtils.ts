/* eslint-disable no-bitwise */
import {
  Address,
  IContractInfo,
  ISchemeState} from "@daostack/arc.js";

/**
 * gotta load moment in order to use moment-timezone directly
 */
import "moment";
import * as moment from "moment-timezone";

import { getArc } from "../arc";

export enum SchemePermissions {
  None = 0,
  IsRegistered = 1, // Always added by default in the controller
  CanRegisterSchemes = 2,
  CanAddRemoveGlobalConstraints = 4,
  CanUpgradeController = 8,
  CanCallDelegateCall = 0x10,
  All = 0x1f,
}

/**
 * These are the permissions that are the minimum that each scheme must have to
 * be able to perform its full range of functionality.
 *
 * Note that '1' is always assigned to a scheme by the Controller when the
 * scheme is registered with the controller.
 */
export const REQUIRED_SCHEME_PERMISSIONS: any = {
  "ContributionReward": SchemePermissions.IsRegistered,
  "GlobalConstraintRegistrar": SchemePermissions.IsRegistered | SchemePermissions.CanAddRemoveGlobalConstraints,
  "SchemeRegistrar": SchemePermissions.All, // TODO: is this correct?
  "UpgradeScheme": SchemePermissions.IsRegistered | SchemePermissions.CanRegisterSchemes | SchemePermissions.CanUpgradeController,
  "VestingScheme": SchemePermissions.IsRegistered,
  "VoteInOrganizationScheme": SchemePermissions.IsRegistered | SchemePermissions.CanCallDelegateCall,
};

/** schemes that we know how to interpret  */
export const KNOWN_SCHEME_NAMES = [
  "ContributionReward",
  "GenericScheme",
  "ReputationFromToken",
  "SchemeRegistrar",
  "UGenericScheme",
  "Competition",
  "ContributionRewardExt",
];

export const PROPOSAL_SCHEME_NAMES = [
  "ContributionReward",
  "GenericScheme",
  "SchemeRegistrar",
  "UGenericScheme",
  "Competition",
  "ContributionRewardExt",
];

/**
 * return true if the address is the address of a known scheme (which we know how to represent)
 * @param  address [description]
 * @return         [description]
 */
export function isKnownScheme(address: Address) {
  const arc = getArc();
  let contractInfo;
  try {
    contractInfo = arc.getContractInfo(address);
  } catch (err) {
    if (err.message.match(/no contract/i)) {
      return false;
    }
    throw err;
  }

  if (KNOWN_SCHEME_NAMES.includes(contractInfo.name)) {
    return true;
  } else {
    return false;
  }
}

export function schemeName(scheme: ISchemeState|IContractInfo, fallback?: string) {
  console.log(scheme.address, scheme.name)
  const schemeNames: any = {
    "0xc072171da83cce311e37bc1d168f54e6a6536df4": "DX Token Registry",
    "0xb3ec6089556cca49549be01ff446cf40fa81c84d": "ENS Public Resolver",
    "0x973ce4e81bdc3bd39f46038f3aaa928b04558b08": "ENS Registry",
    "0xf050f3c6772ff35eb174a6900833243fccd0261f": "Plugin Manager",
    "0x9cea0dd05c4344a769b2f4c2f8890eda8a700d64": "ENS Registry with Fallback",
    "0x9a543aef934c21da5814785e38f9a7892d3cde6e": "ENSPublic Provider",
    "0x199719ee4d5dcf174b80b80afa1fe4a8e5b0e3a0": "DutchX",
    "0x08cc7bba91b849156e9c44ded51896b38400f55b": "Funding and Voting Power"
  };
  return schemeNames[scheme.address];
}

/**
 * given the address (of a scheme), return scheme's name
 * @param  address [description]
 * @return         [description]
 */
export function schemeNameFromAddress(address: string) {
  const arc = getArc();
  try {
    const contractInfo = arc.getContractInfo(address);
    const name = schemeName(contractInfo);
    return name;
  } catch (err) {
    if (err.message.match(/No contract/)) {
      return "";
    }
  }
}

/**
 * given the address (of a scheme), return  a friendly string represeting the scheme's address and it'sname
 * @param  address [description]
 * @return         [description]
 */
export function schemeNameAndAddress(address: string) {
  try {
    const name = schemeNameFromAddress(address);
    if (name !== "") {
      return `${address.slice(0, 4)}...${address.slice(-4)} (${name})`;
    } else {
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
  } catch (err) {
    if (err.message.match(/No contract/)) {
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
  }
}

export enum GetSchemeIsActiveActions {
  Register=1,
  Remove
}

const schemeActionPropNames = new Map<string, Map<GetSchemeIsActiveActions, string>>([
  [
    "SchemeRegistrar", new Map<GetSchemeIsActiveActions, string>([
      [GetSchemeIsActiveActions.Register, "voteRegisterParams"],
      [GetSchemeIsActiveActions.Remove, "voteRemoveParams"],
    ]),
  ],
]);

/**
 * Returns true or false indicating whether the scheme is active and thus can accept new proposals.
 * @param scheme Required parameter that if undefined or null will cause this method to throw an exception.
 * @param action For SchemeRegistrar where we are asking specifically about Add and Remove actions.
 */
export function getSchemeIsActive(scheme: ISchemeState, action?: GetSchemeIsActiveActions): boolean {

  if (!scheme) {
    throw new Error("getSchemeIsActive: scheme parameter is not set");
  }

  let votingMachineParamsPropertyName: string;
  let schemeName = scheme.name ? `${scheme.name[0].toLowerCase()}${scheme.name.slice(1)}` : "";
  if (schemeName === "genericScheme") {
    if (scheme.uGenericSchemeParams) {
      schemeName = "uGenericScheme";
    }
  }

  if (action) { // then the name of the voting machine properties property depends on the action
    const schemeActionsMap = schemeActionPropNames.get(scheme.name);

    if (!schemeActionsMap) {
      throw new Error(`getSchemeIsActive: unknown scheme: ${scheme.name}`);
    }
    const propName = schemeActionsMap.get(action);
    if (!propName) {
      throw new Error(`getSchemeIsActive: unknown action: ${scheme.name}:${action}`);
    }
    votingMachineParamsPropertyName = propName;
  } else {
    /**
     * if scheme is SchemeRegistrar, then it is active if any of its actions are active
     */
    if (scheme.name === "SchemeRegistrar") {
      return getSchemeIsActive(scheme, GetSchemeIsActiveActions.Register) || getSchemeIsActive(scheme, GetSchemeIsActiveActions.Remove);
    } else {
      votingMachineParamsPropertyName = "voteParams";
    }
  }

  const schemeParams = (scheme as any)[`${schemeName}Params`];
  if (!schemeParams) {
    // eslint-disable-next-line no-console
    console.warn(` getSchemeIsActive: scheme parameters not found for ${scheme.name}`);
    return true;
  }
  const votingMachineParams = schemeParams[votingMachineParamsPropertyName];
  if (!votingMachineParams) {
    // eslint-disable-next-line no-console
    console.warn(` getSchemeIsActive: voting machine parameters parameters not found for ${scheme.name}`);
    return true;
  }
  if ((typeof(votingMachineParams.activationTime) === undefined) || (votingMachineParams.activationTime === null)) {
    // eslint-disable-next-line no-console
    console.warn(` getSchemeIsActive: voting machine appears not to be GenesisProtocol: ${scheme.name}`);
    return true;
  } else {
    if (moment(votingMachineParams.activationTime*1000).isSameOrBefore(moment())) {
      return true;
    }
    // eslint-disable-next-line no-console
    console.warn(` getSchemeIsActive: future activation time: ${scheme.name}`);
    return false;
  }
}
