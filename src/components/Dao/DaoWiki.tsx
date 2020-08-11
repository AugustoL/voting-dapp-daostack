import * as React from "react";
import { IDAOState, ISchemeState, Scheme, IProposalType, Proposal, IProposalState } from "@daostack/arc.js";
import classNames from "classnames";
import { enableWalletProvider, getWeb3Provider } from "arc";

import { Link, RouteComponentProps } from "react-router-dom";
import * as arcActions from "actions/arcActions";
import { showNotification, NotificationStatus } from "reducers/notifications";
import { schemeName, getSchemeIsActive } from "lib/schemeUtils";
import { ISubscriptionProps } from "components/Shared/withSubscription";

import * as proposalStyle from "../Scheme/SchemeProposals.scss";

type IExternalProps = {
  daoState: IDAOState;
  currentAccountAddress: string;
} & RouteComponentProps<any>;


interface IDispatchProps {
  showNotification: typeof showNotification;
}

type SubscriptionData = ISubscriptionProps<[Scheme[], Proposal[]]>;
type IProps = IDispatchProps & IExternalProps & SubscriptionData;

export default class DaoWiki extends React.Component<IProps> {
  // state management
  const [hasWikiScheme, setHasWikiScheme] = React.useState<boolean>(false);
  const [, setWikiSchemeAddress] = React.useState<string>("");
  const [schemes, proposals] = props.data;
  const [, setIsActive] = React.useState<boolean>(false);

  constructor(props: IProps) {
    super(props);
  }

  // Check Wiki Scheme
  async checkIfWikiSchemeExists() {
    const genericSchemes = schemes.filter((scheme: Scheme) => scheme.staticState.name === "GenericScheme");
    const states: ISchemeState[] = [];
    const getSchemeState = () => {
      return new Promise((resolve, reject) => {
        try {
          genericSchemes.map((scheme: Scheme) => scheme.state().subscribe((state: any) => states.push(state)));
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    };
    await getSchemeState();
    const hasWikiScheme = (schemeState: ISchemeState) => {
      return "underscore protocol" === schemeName(schemeState, "[Unknown]");
    };
    const wikiSchemeExists = states.some(hasWikiScheme);
    setHasWikiScheme(wikiSchemeExists);
    if (wikiSchemeExists) {
      if (!(await enableWalletProvider({ showNotification: props.showNotification }))) {
        props.showNotification(NotificationStatus.Failure, "You must be logged in to use Wiki!");
        return;
      }
      const wikiUpdateScheme = states.find(hasWikiScheme);
      setIsActive(getSchemeIsActive(wikiUpdateScheme));
      const web3Provider = await getWeb3Provider();
      console.log(web3Provider);
      setWikiSchemeAddress(wikiUpdateScheme.id);

      const checkProposals = (proposal: Proposal) => {
        const state = proposal.staticState as IProposalState;
        return state.title === "Set home perspective";
      };

      const homeProposalExists = proposals.some(checkProposals);
      console.log(homeProposalExists);

    }
  };

  async registerWikiScheme() {
    if (!(await enableWalletProvider({ showNotification: props.showNotification }))) {
      return;
    }

    const checkProposals = (proposal: Proposal) => {
      const state = proposal.staticState as IProposalState;
      return state.title === "Creation of WikiUpdate scheme";
    };

    const wikiProposalAlreadyExists = proposals.some(checkProposals);
    const dao = props.daoState.address;
    const schemeRegistrar = schemes.find((scheme: Scheme) => scheme.staticState.name === "SchemeRegistrar");

    if (wikiProposalAlreadyExists) {
      props.showNotification(NotificationStatus.Success, "Wiki Scheme proposal has already been created!");
      props.history.replace(`/dao/${dao}/scheme/${schemeRegistrar.id}`);
    } else {
      const proposalValues = {
        dao,
        type: IProposalType.SchemeRegistrarAdd,
        permissions: "0x" + (17).toString(16).padStart(8, "0"),
        value: 0,
        tags: ["Wiki"],
        title: "Creation of WikiUpdate scheme",
        description: "This will allow DAO to have Wiki functionality",
        parametersHash: "0x00000000000000000000000000000000000000000",
        scheme: schemeRegistrar.staticState.address,
        schemeToRegister: "0x0800340862fCA767b3007fE3b297f5F16a441dC8", // rinkeby
      };
      await arcActions.createProposal(proposalValues);
    }
  };

  renderNoWikiScheme() {
    return (
      <div className={proposalStyle.noDecisions}>
        <img className={proposalStyle.relax} src="/assets/images/yogaman.svg" />
        <div className={proposalStyle.proposalsHeader}>Wiki scheme not registered on this DAO yet</div>
        <p>You can create the proposal to register it today! (:</p>
        <div className={proposalStyle.cta}>
          <Link to={"/dao/" + this.props.daoState.address}>
            <img className={proposalStyle.relax} src="/assets/images/lt.svg" /> Back to home
          </Link>
          <a
            className={classNames({
              [proposalStyle.blueButton]: true,
            })}
            onClick={registerWikiScheme}
            data-test-id="createProposal"
          >
            + Register wiki scheme
          </a>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        <div className={daoStyle.daoHistoryHeader}>Wiki</div>
        {hasWikiScheme && this.props.currentAccountAddress ? (
          <div style={{ marginTop: '-31px', minHeight: 'calc(100vh - 241px)', display: 'flex', flexDirection: 'column' }}>
            <module-container style={{flexGrow: '1', flexDirection: 'column', display: 'flex' }}>
              <h1>Hello wiki</h1>
            </module-container>
          </div>
        ) : !this.props.currentAccountAddress ? (
          <div className={proposalStyle.noDecisions}>
            <div className={proposalStyle.proposalsHeader}>You must be logged in to interact with Wiki</div>
          </div>
        ) : this.renderNoWikiScheme}
      </div>
    );
  }  
}
