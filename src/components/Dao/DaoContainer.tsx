import { IDAOState, Member } from "@daostack/arc.js";
import { getProfilesForAddresses } from "actions/profilesActions";
import { getArc } from "arc";
import CreateProposalPage from "components/Proposal/Create/CreateProposalPage";
import ProposalDetailsPage from "components/Proposal/ProposalDetailsPage";
import SchemeContainer from "components/Scheme/SchemeContainer";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as React from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { Route, RouteComponentProps, Switch } from "react-router-dom";
//@ts-ignore
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import DetailsPageRouter from "components/Scheme/ContributionRewardExtRewarders/DetailsPageRouter";
import { combineLatest, Subscription } from "rxjs";
import DaoSchemesPage from "./DaoSchemesPage";
import DaoHistoryPage from "./DaoHistoryPage";
import DaoMembersPage from "./DaoMembersPage";
import * as css from "./Dao.scss";
import DaoLandingPage from "components/Dao/DaoLandingPage";
import DaoWiki from "./DaoWiki";
import DaoManifestoPage from "components/Dao/DaoManifestoPage";

type IExternalProps = RouteComponentProps<any>;

interface IStateProps {
  currentAccountAddress: string;
  currentAccountProfile: IProfileState;
  daoAvatarAddress: string;
}

interface IDispatchProps {
  getProfilesForAddresses: typeof getProfilesForAddresses;
  showNotification: typeof showNotification;
}

type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<[IDAOState, Member[]]>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    currentAccountAddress: state.web3.currentAccountAddress,
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
    daoAvatarAddress: process.env.DAO_AVATAR_ADDRESS,
  };
};

const mapDispatchToProps = {
  getProfilesForAddresses,
  showNotification,
};

class DaoContainer extends React.Component<IProps, null> {
  public daoSubscription: any;
  public subscription: Subscription;

  public async componentDidMount() {
    // TODO: use this once 3box fixes Box.getProfiles
    //this.props.getProfilesForAddresses(this.props.data[1].map((member) => member.staticState.address));
  }
  
  
  private daoHistoryRoute = (routeProps: any) => <DaoHistoryPage {...routeProps} daoState={this.props.data[0]} currentAccountAddress={this.props.currentAccountAddress} />;
  private daoMembersRoute = (routeProps: any) => <DaoMembersPage {...routeProps} daoState={this.props.data[0]} />;
  private daoProposalRoute = (routeProps: any) =>
    <ProposalDetailsPage {...routeProps}
      currentAccountAddress={this.props.currentAccountAddress}
      daoState={this.props.data[0]}
      proposalId={routeProps.match.params.proposalId}
    />;
  private daoCrxProposalRoute = (routeProps: any) =>
    <DetailsPageRouter {...routeProps}
      currentAccountAddress = {this.props.currentAccountAddress}
      daoState={this.props.data[0]}
      proposalId={routeProps.match.params.proposalId}
    />;

  private daoWikiRoute = (routeProps: any) => <DaoWiki {...routeProps} daoState={this.props.data[0]} currentAccountAddress={this.props.currentAccountAddress}/>;

  private schemeRoute = (routeProps: any) => <SchemeContainer {...routeProps} daoState={this.props.data[0]} currentAccountAddress={this.props.currentAccountAddress} />;
  private daoSchemesRoute = (routeProps: any) => <DaoSchemesPage {...routeProps} daoState={this.props.data[0]} />;
  private daoLandingRoute = (_routeProps: any) => <DaoLandingPage daoState={this.props.data[0]} />;
  private daoManifestoRoute = (_routeProps: any) => <DaoManifestoPage />;
  private createProposalRoute = (routeProps: any) => <CreateProposalPage {...routeProps} daoState={this.props.data[0]} />;

  public render(): RenderOutput {
    const daoState = this.props.data[0];

    return (
      <div className={css.outer}>
        <Helmet>
          <meta name="description" content={daoState.name + " | Managed on Alchemy by DAOstack"} />
          <meta name="og:description" content={daoState.name + " | Managed on Alchemy by DAOstack"} />
          <meta name="twitter:description" content={daoState.name + " | Managed on Alchemy by DAOstack"} />
        </Helmet>

        <div className={css.wrapper}>
          <div className={css.noticeWrapper}>
            <div className={css.noticeBuffer}></div>
            <div className={css.notice}>
              <div>
                <img src="assets/images/Icon/notice.svg" />
                Alchemy and Arc are in Alpha. There will be BUGS! We don&apos;t guarantee complete security. *Play at your own risk*
              </div>
            </div>
          </div>
          <Switch>
            <Route exact path="/dao"
              render={this.daoLandingRoute} />
            <Route exact path="/dao/manifesto"
              render={this.daoManifestoRoute} />
            <Route exact path="/dao/history"
              render={this.daoHistoryRoute} />
            <Route exact path="/dao/members"
              render={this.daoMembersRoute} />

            <Route exact path="/dao/wiki" 
              render={this.daoWikiRoute} />

            <Route exact path="/dao/proposal/:proposalId"
              render={this.daoProposalRoute}
            />

            <Route path="/dao/crx/proposal/:proposalId"
              render={this.daoCrxProposalRoute} />

            <Route path="/dao/scheme/:schemeId/proposals/create" render={this.createProposalRoute} />
            <Route path="/dao/scheme/:schemeId"
              render={this.schemeRoute} />

            <Route exact path="/dao/schemes"
              render={this.daoSchemesRoute} />

            <Route path="/dao" render={this.daoLandingRoute} />

          </Switch>

        </div>
      </div>
    );
  }
}

const SubscribedDaoContainer = withSubscription({
  wrappedComponent: DaoContainer,
  loadingComponent: <Loading/>,
  errorComponent: (props) => <div>{props.error.message}</div>,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    const dao = arc.dao(process.env.DAO_AVATAR_ADDRESS);
    const observable = combineLatest(
      dao.state({ subscribe: true, fetchAllData: true }), // DAO state
      dao.members()
    );
    return observable;
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedDaoContainer);
