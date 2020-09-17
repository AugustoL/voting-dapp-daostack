import { Address, IDAOState, IProposalStage, IProposalOutcome } from "@daostack/arc.js";
import classNames from "classnames";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import ProposalCountdown from "components/Shared/ProposalCountdown";
import FollowButton from "components/Shared/FollowButton";
import { humanProposalTitle, ensureHttps, formatFriendlyDateForLocalTimezone, safeMoment } from "lib/util";
import { Page } from "pages";
import * as React from "react";


import { Link, RouteComponentProps } from "react-router-dom";
import { closingTime, proposalEnded } from "lib/proposalHelpers";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import { rewarderContractName } from "components/Scheme/ContributionRewardExtRewarders/rewardersProps";
import ActionButton from "./ActionButton";
import BoostAmount from "./Staking/BoostAmount";
import StakeButtons from "./Staking/StakeButtons";
import StakeGraph from "./Staking/StakeGraph";
import { default as ProposalData, IInjectedProposalProps } from "./ProposalData";
import ProposalStatus from "./ProposalStatus";
import ProposalSummary from "./ProposalSummary";
import VoteBreakdown from "./Voting/VoteBreakdown";
import VoteButtons from "./Voting/VoteButtons";
import VoteGraph from "./Voting/VoteGraph";
import VotersModal from "./Voting/VotersModal";
import * as css from "./ProposalDetails.scss";
import ProposalDescription from "components/Shared/ProposalDescription";

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
  daoState: IDAOState;
  detailView?: boolean;
  proposalId: string;
}

type IProps = IExternalProps & IInjectedProposalProps;

interface IState {
  showVotersModal: boolean;
  showShareModal: boolean;
}

class ProposalDetailsPage extends React.Component<IProps, IState> {
  /**
   * Define these here rather than in `render` to minimize rerendering, particularly
   * of the disqus component
   **/
  private crxContractName: string;
  private disqusConfig = { url: "", identifier: "", title: "" };
  private proposalClass = classNames({
    [css.proposal]: true,
    clearfix: true,
  });

  constructor(props: IProps) {
    super(props);

    this.state = {
      showShareModal: false,
      showVotersModal: false,
    };
  }

  public componentDidMount() {

    this.crxContractName = rewarderContractName(this.props.proposal.scheme);
  }

  private showVotersModal = (votesCount: number) => (_event: any): void => {
    if (votesCount > 0) {
      this.setState({ showVotersModal: true });
    }
  }

  private closeVotersModal = (_event: any): void => {
    this.setState({ showVotersModal: false });
  }

  public render(): RenderOutput {
    const {
      beneficiaryProfile,
      creatorProfile,
      currentAccountAddress,
      currentAccountGenAllowance,
      currentAccountGenBalance,
      daoEthBalance,
      daoState,
      expired,
      member,
      proposal,
      rewards,
      stakes,
      votes,
    } = this.props;

    if (daoState.id !== proposal.dao.id) {
      return <div>`The given proposal does not belong to ${daoState.name}. Please check the browser url.`</div>;
    }

    const tags = proposal.tags;

    const url = ensureHttps(proposal.url);

    this.disqusConfig.title = this.props.proposal.title;
    this.disqusConfig.identifier = this.props.proposalId;

    let currentAccountVote: IProposalOutcome | undefined;

    if (votes.length > 0) {
      const currentVote = this.props.votes[0];
      currentAccountVote = currentVote.staticState.outcome;
    }
    return (
      <div className={css.wrapper}>
        <div className={this.proposalClass} data-test-id={"proposal-" + proposal.id}>
          <div className={css.proposalInfo}>
            <div>
              <div className={css.statusContainer}>
                <ProposalStatus proposalState={proposal} />
              </div>

              <div className={css.actionButtonContainer}>
                <ActionButton
                  currentAccountAddress={currentAccountAddress}
                  daoState={daoState}
                  daoEthBalance={daoEthBalance}
                  detailView
                  parentPage={Page.ProposalDetails}
                  proposalState={proposal}
                  rewards={rewards}
                  expired={expired}
                />
              </div>
              {
                (this.crxContractName) ? <div className={css.gotoCompetition}>
                  {
                    <Link to={`/dao/crx/proposal/${proposal.id}`}>Go to {this.crxContractName}&nbsp;&gt;</Link>
                  }
                </div> : ""
              }
            </div>
            <h3 className={css.proposalTitleTop}>
              <Link to={"/dao/proposal/" + proposal.id} data-test-id="proposal-title">{humanProposalTitle(proposal)}</Link>
            </h3>

            <div className={css.timer + " clearfix"}>
              {!proposalEnded(proposal) ?
                <span className={css.content}>
                  {!expired ?
                    <ProposalCountdown proposal={proposal} detailView /> :
                    <span className={css.closedTime}>
                      {proposal.stage === IProposalStage.Queued ? "Expired" :
                        proposal.stage === IProposalStage.PreBoosted ? "Ready to Boost" :
                          "Closed"}&nbsp;
                      {closingTime(proposal).format("MMM D, YYYY")}
                    </span>
                  }
                </span>
                : " "}
            </div>

            <div className={css.createdBy}>
              <AccountPopup accountAddress={proposal.proposer} daoState={daoState} width={35} />
              <AccountProfileName accountAddress={proposal.proposer} accountProfile={creatorProfile} daoAvatarAddress={daoState.address} detailView />
            </div>

            <div className={css.description}>
              <ProposalDescription description={proposal.description} />
            </div>

            {url ?
              <a href={url} className={css.attachmentLink} target="_blank" rel="noopener noreferrer">
                <img src="assets/images/Icon/Attachment.svg" />
            Attachment &gt;
              </a>
              : " "
            }

            <div className={classNames({
              [css.proposalSummaryContainer]: true,
              [css.hasTags]: tags && tags.length,
            })}>
              <ProposalSummary proposal={proposal} dao={daoState} beneficiaryProfile={beneficiaryProfile} detailView />
            </div>

            {tags && tags.length ? <div className={css.tagsContainer}>
              <TagsSelector readOnly darkTheme tags={tags}></TagsSelector>
            </div> : ""}

            <div className={css.buttonBar}>
              <div className={css.voteButtonsBottom}>
                <span className={css.voteLabel}>Vote:</span>
                <div className={css.altVoteButtons}>
                  <VoteButtons
                    altStyle
                    currentAccountAddress={currentAccountAddress}
                    currentVote={currentAccountVote}
                    dao={daoState}
                    expired={expired}
                    currentAccountState={member}
                    proposal={proposal}
                    parentPage={Page.ProposalDetails}
                  />
                </div>
              </div>

              <div className={css.followButton}><FollowButton type="proposals" id={proposal.id} style="bigButton" /></div>
            </div>
          </div>

          <div className={css.proposalActions + " clearfix"}>
            <div className={css.votes}>
              <div className={css.header}>
                <div className={css.title}>Votes</div>
                <div onClick={this.showVotersModal(proposal.votesCount)} className={classNames({ [css.voters]: true, [css.clickable]: proposal.votesCount > 0 })}>
                  {proposal.votesCount} Vote{proposal.votesCount === 1 ? "" : "s"} &gt;
                </div>

                <div className={css.voteButtons}>
                  <VoteButtons
                    currentAccountAddress={currentAccountAddress}
                    currentAccountState={member}
                    currentVote={currentAccountVote}
                    dao={daoState}
                    expired={expired}
                    proposal={proposal}
                    parentPage={Page.ProposalDetails}
                  />
                </div>
              </div>

              <div className={css.voteStatus}>
                <div className={css.voteGraph}>
                  <VoteGraph size={90} proposal={proposal} />
                </div>

                <VoteBreakdown
                  currentAccountAddress={currentAccountAddress}
                  currentAccountState={member}
                  currentVote={currentAccountVote}
                  daoState={daoState}
                  detailView
                  proposal={proposal} />
              </div>
            </div>

            <div className={css.predictions}>
              <div className={css.header}>
                <div className={css.title}>Predictions</div>

                <div className={css.stakeButtons}>
                  <StakeButtons
                    beneficiaryProfile={beneficiaryProfile}
                    currentAccountAddress={currentAccountAddress}
                    currentAccountGens={currentAccountGenBalance}
                    currentAccountGenStakingAllowance={currentAccountGenAllowance}
                    dao={daoState}
                    parentPage={Page.ProposalDetails}
                    expired={expired}
                    proposal={proposal}
                    stakes={stakes}
                  />
                </div>
              </div>

              <div className={css.predictionStatus}>
                <StakeGraph
                  proposal={proposal}
                  detailView
                />
                <BoostAmount detailView expired={expired} proposal={proposal} />
              </div>
            </div>

            <div className={css.eventHistory}>
              <div className={css.event}>
                <div className={css.label}>Created:</div>
                <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(safeMoment(proposal.createdAt))}</div>
              </div>
              {proposal.executedAt ?
                <div className={css.event}>
                  <div className={css.label}>Executed:</div>
                  <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(safeMoment(proposal.executedAt))}</div>
                </div>
                : ""}
            </div>

          </div>
        </div>

        {this.state.showVotersModal ?
          <VotersModal
            closeAction={this.closeVotersModal}
            currentAccountAddress={this.props.currentAccountAddress}
            dao={daoState}
            proposal={proposal}
            accountProfile={creatorProfile}
          /> : ""
        }

      </div>
    );
  }
}

export default function ProposalDetailsPageData(props: IExternalProps) {
  const { currentAccountAddress, daoState, proposalId } = props;
  return <ProposalData currentAccountAddress={currentAccountAddress} daoState={daoState} proposalId={proposalId} subscribeToProposalDetails>
    {proposalData => <ProposalDetailsPage {...props} {...proposalData} />}
  </ProposalData>;
}
