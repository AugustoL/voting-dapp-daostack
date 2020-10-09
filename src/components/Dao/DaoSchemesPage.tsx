import { CompetitionScheme, IDAOState, ISchemeState, Scheme } from "@daostack/arc.js";
import { enableWalletProvider, getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import UnknownSchemeCard from "components/Dao/UnknownSchemeCard";

import { KNOWN_SCHEME_NAMES, PROPOSAL_SCHEME_NAMES } from "lib/schemeUtils";
import * as React from "react";

import { RouteComponentProps } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import { combineLatest, Observable, of } from "rxjs";
import { mergeMap } from "rxjs/operators";
import * as css from "./DaoSchemesPage.scss";
import ProposalSchemeCard from "./ProposalSchemeCard";
import SimpleSchemeCard from "./SimpleSchemeCard";

const Fade = ({ children, ...props }: any) => (
  <CSSTransition
    {...props}
    timeout={1000}
    classNames={{
      enter: css.fadeEnter,
      enterActive: css.fadeEnterActive,
      exit: css.fadeExit,
      exitActive: css.fadeExitActive,
    }}
  >
    {children}
  </CSSTransition>
);

interface IDispatchProps {
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  showNotification,
};

type IExternalProps = {
  daoState: IDAOState;
} & RouteComponentProps<any>;

type IProps = IExternalProps & ISubscriptionProps<[Scheme[], ISchemeState]> & IDispatchProps;

class DaoSchemesPage extends React.Component<IProps, null> {

  public handleNewProposal = (schemeId: string) => async (): Promise<void> => {
    const { showNotification } = this.props;

    if (!await enableWalletProvider({ showNotification })) { return; }

    this.props.history.push(`/dao/scheme/${schemeId}/proposals/create/`);
  };

  public render() {
    const { data } = this.props;
    const dao = this.props.daoState;
    const allSchemes = data[0];
    
    const contributionReward = allSchemes.filter((scheme: Scheme) => scheme.staticState.name === "ContributionReward");
    const knownSchemes = allSchemes.filter((scheme: Scheme) => scheme.staticState.name !== "ContributionReward" && KNOWN_SCHEME_NAMES.indexOf(scheme.staticState.name) >= 0);
    const unknownSchemes = allSchemes.filter((scheme: Scheme) => KNOWN_SCHEME_NAMES.indexOf(scheme.staticState.name) === -1 );
    const allKnownSchemes = [...contributionReward, ...knownSchemes];

    const schemeCardsHTML = (
      <TransitionGroup>
        { allKnownSchemes.map((scheme: Scheme) => (
          <Fade key={"scheme " + scheme.id}>
            {PROPOSAL_SCHEME_NAMES.includes(scheme.staticState.name)
              ?
              <ProposalSchemeCard dao={dao} scheme={scheme} />
              : <SimpleSchemeCard dao={dao} scheme={scheme} />
            }
          </Fade>
        ))
        }

        {!unknownSchemes ? "" :
          <Fade key={"schemes unknown"}>
            <UnknownSchemeCard schemes={unknownSchemes} />
          </Fade>
        }
      </TransitionGroup>
    );

    return (
      <div className={css.wrapper}>
        {(allKnownSchemes.length + unknownSchemes.length) === 0
          ? <div>
            <img src="assets/images/meditate.svg" />
            <div>
              No plugins registered
            </div>
          </div>
          :
          <div>{schemeCardsHTML}</div>
        }
      </div>
    );
  }
}

const SubscribedDaoSchemesPage = withSubscription({
  wrappedComponent: DaoSchemesPage,
  loadingComponent: <Loading/>,
  errorComponent: (props) => <span>{props.error.message}</span>,
  checkForUpdate: [],
  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    const dao = arc.dao(process.env.DAO_AVATAR_ADDRESS);
    return combineLatest(
      dao.schemes({ where: { isRegistered: true } }, { fetchAllData: true, subscribe: true }),
      // Find the SchemeManager scheme if this dao has one
      Scheme.search(arc, {where: { dao: dao.id, name: "SchemeRegistrar" }}).pipe(mergeMap((scheme: Array<Scheme | CompetitionScheme>): Observable<ISchemeState> => scheme[0] ? scheme[0].state() : of(null)))
    );
  },
});

export default connect(null, mapDispatchToProps)(SubscribedDaoSchemesPage);
