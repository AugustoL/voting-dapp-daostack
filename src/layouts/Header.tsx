import * as uiActions from "actions/uiActions";
import { threeBoxLogout } from "actions/profilesActions";
import { enableWalletProvider, getAccountIsEnabled, getArc, logout, getWeb3ProviderInfo, getWeb3Provider, providerHasConfigUi } from "arc";
import AccountBalances from "components/Account/AccountBalances";
import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import CopyToClipboard from "components/Shared/CopyToClipboard";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import { parse } from "query-string";
import * as React from "react";
import { connect } from "react-redux";
import { Link, matchPath, RouteComponentProps } from "react-router-dom";
import { RefObject } from "react";
import classNames from "classnames";
import { Address, IDAOState } from "@daostack/arc.js";
import { ETHDENVER_OPTIMIZATION } from "../settings";
import * as css from "./App.scss";
import ProviderConfigButton from "layouts/ProviderConfigButton";

interface IExternalProps extends RouteComponentProps<any> {
}

interface IStateProps {
  showRedemptionsButton: boolean;
  currentAccountProfile: IProfileState;
  currentAccountAddress: string | null;
  daoAvatarAddress: Address;
  menuOpen: boolean;
  threeBox: any;
}

const mapStateToProps = (state: IRootState & IStateProps, ownProps: IExternalProps): IExternalProps & IStateProps => {
  const match = matchPath(ownProps.location.pathname, {
    path: "/dao/:daoAvatarAddress",
    strict: false,
  });
  const queryValues = parse(ownProps.location.search);

  // TODO: this is a temporary hack to send less requests during the ethDenver conference:
  // we hide the demptionsbutton when the URL contains "crx". Should probably be disabled at later date..
  let showRedemptionsButton;
  if (ETHDENVER_OPTIMIZATION) {
    showRedemptionsButton = (ownProps.location.pathname.indexOf("crx") === -1);
  } else {
    showRedemptionsButton = true;
  }

  return {
    ...ownProps,
    showRedemptionsButton,
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
    currentAccountAddress: state.web3.currentAccountAddress,
    daoAvatarAddress: match && match.params ? (match.params as any).daoAvatarAddress : queryValues.daoAvatarAddress,
    menuOpen: state.ui.menuOpen,
    threeBox: state.profiles.threeBox,
  };
};

interface IDispatchProps {
  showNotification: typeof showNotification;
  toggleMenu: typeof uiActions.toggleMenu;
  toggleTrainingTooltipsOnHover: typeof uiActions.toggleTrainingTooltipsOnHover;
  enableTrainingTooltipsOnHover: typeof uiActions.enableTrainingTooltipsOnHover;
  disableTrainingTooltipsOnHover: typeof uiActions.disableTrainingTooltipsOnHover;
  enableTrainingTooltipsShowAll: typeof uiActions.enableTrainingTooltipsShowAll;
  disableTrainingTooltipsShowAll: typeof uiActions.disableTrainingTooltipsShowAll;
  threeBoxLogout: typeof threeBoxLogout;
}

const mapDispatchToProps = {
  showNotification,
  toggleMenu: uiActions.toggleMenu,
  toggleTrainingTooltipsOnHover: uiActions.toggleTrainingTooltipsOnHover,
  enableTrainingTooltipsOnHover: uiActions.enableTrainingTooltipsOnHover,
  disableTrainingTooltipsOnHover: uiActions.disableTrainingTooltipsOnHover,
  enableTrainingTooltipsShowAll: uiActions.enableTrainingTooltipsShowAll,
  disableTrainingTooltipsShowAll: uiActions.disableTrainingTooltipsShowAll,
  threeBoxLogout,
};

type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<IDAOState>;

class Header extends React.Component<IProps, null> {

  constructor(props: IProps) {
    super(props);
    this.toggleDiv = React.createRef();
    this.initializeTrainingTooltipsToggle();
  }

  private static trainingTooltipsEnabledKey = "trainingTooltipsEnabled";
  private toggleDiv: RefObject<HTMLDivElement>;

  public componentDidMount() {
    if (this.toggleDiv.current) {
      this.toggleDiv.current.onmouseenter = (_ev: MouseEvent) => {
        this.props.enableTrainingTooltipsShowAll();
      };
      this.toggleDiv.current.onmouseleave = (_ev: MouseEvent) => {
        this.props.disableTrainingTooltipsShowAll();
      };
    }

    this.setState({ alchemyVersion: PACKAGE_VERSION ?? "Not found" });
  }

  public handleClickLogin = async (_event: any): Promise<void> => {
    enableWalletProvider({
      suppressNotifyOnSuccess: true,
      showNotification: this.props.showNotification,
    });
  }

  public handleConnect = async (_event: any): Promise<void> => {
    enableWalletProvider({
      suppressNotifyOnSuccess: true,
      showNotification: this.props.showNotification,
    });
  }

  public handleClickLogout = async (_event: any): Promise<void> => {
    await logout(this.props.showNotification);
    await this.props.threeBoxLogout();
  }

  private handleToggleMenu = (_event: any): void => {
    this.props.toggleMenu();
  }

  private getTrainingTooltipsEnabled(): boolean {
    const trainingTooltipsOnSetting = localStorage.getItem(Header.trainingTooltipsEnabledKey);
    return (trainingTooltipsOnSetting === null) || trainingTooltipsOnSetting === "true";
  }

  private initializeTrainingTooltipsToggle() {
    const trainingTooltipsOn = this.getTrainingTooltipsEnabled();
    if (trainingTooltipsOn) {
      this.props.enableTrainingTooltipsOnHover();
    } else {
      this.props.disableTrainingTooltipsOnHover();
    }
  }

  public render(): RenderOutput {
    const {
      currentAccountProfile,
      currentAccountAddress,
    } = this.props;
    const dao = this.props.data;

    const daoAvatarAddress = process.env.DAO_AVATAR_ADDRESS;
    const accountIsEnabled = getAccountIsEnabled();
    const web3ProviderInfo = getWeb3ProviderInfo();
    const web3Provider = getWeb3Provider();

    return (
      <div className={css.headerContainer}>
        <nav className={css.header}>
          <div className={css.menuToggle} onClick={this.handleToggleMenu}>
            {this.props.menuOpen ?
              <img src="assets/images/Icon/Close.svg"/> :
              <img src="assets/images/Icon/Menu.svg"/>}
          </div>
          <TrainingTooltip overlay="Go to home" placement="bottomRight">
            <div className={css.menu}>
              <Link to={"/dao"}>
                <img src="assets/images/DXD.svg"/>
              </Link>
            </div>
          </TrainingTooltip>
          <div className={css.headerOptions}>
            <Link to={"/dao/history"}>History</Link>
            <span>|</span>
            <Link to={"/dao/members"}>Members</Link>
            <span>|</span>
            <Link to={"/dao/wiki"}>Wiki</Link>
            <span>|</span>
            <Link to={"/dao/schemes"}>Proposals</Link>
            <span>|</span>
            <Link to={"/dao/manifesto"}>Manifesto</Link>
            <span>|</span>
            <a target="_blank" href={"https://etherscan.io/tokenholdings?a="+process.env.DAO_AVATAR_ADDRESS}>Treasury</a>
          </div>
          <div className={css.accountInfo}>
            { currentAccountAddress ?
              <span>
                <div className={css.accountInfoContainer}>
                  <div className={css.accountImage}>
                    <div className={classNames({ [css.profileLink]: true, [css.noAccount]: !accountIsEnabled })}>
                      <AccountProfileName accountAddress={currentAccountAddress}
                        accountProfile={currentAccountProfile} daoAvatarAddress={daoAvatarAddress} />
                      <span className={classNames({ [css.walletImage]: true, [css.greyscale]: !accountIsEnabled })}>
                        <AccountImage accountAddress={currentAccountAddress} profile={currentAccountProfile} width={50} />
                      </span>
                    </div>
                  </div>
                </div>
                <div className={css.wallet}>
                  <div className={css.pointer}></div>
                  <div className={css.walletDetails}>
                    <div className={classNames({ [css.walletImage]: true, [css.greyscale]: !accountIsEnabled })}>
                      <AccountImage accountAddress={currentAccountAddress} profile={currentAccountProfile} width={50} />
                    </div>
                    <div className={css.profileName}>
                      <AccountProfileName accountAddress={currentAccountAddress}
                        accountProfile={currentAccountProfile} daoAvatarAddress={daoAvatarAddress} />
                    </div>
                    <div className={css.copyAddress}>
                      <div className={css.accountAddress}>{currentAccountAddress ? currentAccountAddress.slice(0, 40) : "No account known"}</div>
                      <CopyToClipboard value={currentAccountAddress} tooltipPlacement="left" />
                    </div>
                    <div className={css.fullProfile}>
                      <Link className={css.profileLink} to={"/profile/" + currentAccountAddress + (daoAvatarAddress ? "?daoAvatarAddress=" + daoAvatarAddress : "")}>
                      Full Profile
                      </Link>
                    </div>
                  </div>
                  <AccountBalances dao={dao} address={currentAccountAddress} />
                  <div className={css.logoutButtonContainer}>
                    { accountIsEnabled ?
                      <div className={css.web3ProviderLogoutSection}>
                        <div className={css.provider}>
                          <div className={css.title}>Provider</div>
                          <div className={css.name}>{web3ProviderInfo.name}</div>
                        </div>
                        { providerHasConfigUi(web3Provider) ?
                          <div className={css.providerconfig}><ProviderConfigButton provider={web3Provider} providerName={web3ProviderInfo.name}></ProviderConfigButton></div>
                          : ""
                        }
                        <div className={css.web3ProviderLogInOut} onClick={this.handleClickLogout}><div className={css.text}>Log out</div> <img src="assets/images/Icon/logout.svg"/></div>
                      </div> :
                      <div className={css.web3ProviderLogInOut} onClick={this.handleConnect}><div className={css.text}>Connect</div> <img src="assets/images/Icon/login.svg"/></div> }
                  </div>
                </div>
              </span> : <span></span>
            }
            {!currentAccountAddress ?
              <div className={css.web3ProviderLogin}>
                <TrainingTooltip placement="bottomLeft" overlay={"Click here to connect your wallet provider"}>
                  <button onClick={this.handleClickLogin} data-test-id="loginButton">
                    Log in <img src="assets/images/Icon/login-white.svg"/>
                  </button>
                </TrainingTooltip>
              </div>
              : (!accountIsEnabled) ?
                <div className={css.web3ProviderLogin}>
                  <TrainingTooltip placement="bottomLeft" overlay={"Click here to connect your wallet provider"}>
                    <button onClick={this.handleConnect} data-test-id="connectButton">
                      <span className={css.connectButtonText}>Connect</span><img src="assets/images/Icon/login-white.svg"/>
                    </button>
                  </TrainingTooltip>
                </div>
                : ""
            }
          </div>
        </nav>
      </div>
    );
  }
}

const SubscribedHeader = withSubscription({
  wrappedComponent: Header,
  loadingComponent: null,
  errorComponent: (props) => <div>{props.error.message}</div>,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IProps) => {
    const arc = getArc();
    // subscribe if only to get DAO reputation supply updates
    return arc.dao(process.env.DAO_AVATAR_ADDRESS).state({ subscribe: true });
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedHeader);
