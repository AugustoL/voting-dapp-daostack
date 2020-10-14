import * as React from 'react'
import classNames from 'classnames'
import {
  IDAOState,
  ISchemeState,
  Scheme,
  IProposalType,
  Proposal,
  IProposalState,
  IProposalStage,
} from '@daostack/arc.js'
import { enableWalletProvider } from 'arc'

import { connect } from 'react-redux'
import { combineLatest } from 'rxjs'
import Loading from 'components/Shared/Loading'

import { RouteComponentProps, Link } from 'react-router-dom'
import * as arcActions from 'actions/arcActions'
import { showNotification, NotificationStatus } from 'reducers/notifications'
import { schemeName, getSchemeIsActive } from 'lib/schemeUtils'
import withSubscription, {
  ISubscriptionProps,
} from 'components/Shared/withSubscription'


import * as daoStyle from './Dao.scss'
import * as proposalStyle from '../Scheme/SchemeProposals.scss'
import { Action, GenericSchemeRegistry } from 'genericSchemeRegistry'

import { EveesRemote, EveesModule, Perspective, deriveSecured } from '@uprtcl/evees'

import { EthereumContract } from '@uprtcl/ethereum-provider'

import { uprtcl } from '../../index'

interface IGenericSchemeProposal {
  methodName: string
  methodParams: Array<string | number>
}

type IExternalProps = {
  daoState: IDAOState
  currentAccountAddress: string
} & RouteComponentProps<any>

const mapDispatchToProps = {
  createProposal: arcActions.createProposal,
  voteOnProposal: arcActions.voteOnProposal,
  showNotification,
}
interface IDispatchProps {
  createProposal: typeof arcActions.createProposal
  voteOnProposal: typeof arcActions.voteOnProposal
  showNotification: typeof showNotification
}

type SubscriptionData = ISubscriptionProps<[Scheme[], Proposal[]]>
type IProps = IDispatchProps & IExternalProps & SubscriptionData
type IState = {
  loading: boolean
  hasWikiScheme: boolean
  wikiId: string | undefined
  isActive: boolean
  schemeAddress: string
}

class DaoWiki extends React.Component<IProps, IState> {
  schemes: Scheme[]
  proposals: Proposal[]
  defaultRemote: EveesRemote
  officialRemote: EveesRemote
  wikiUpdateScheme: ISchemeState
  
  homePerspectivesContract: EthereumContract

  private container = React.createRef<HTMLDivElement>()

  constructor(props: IProps) {
    super(props)
    this.state = {
      loading: true,
      hasWikiScheme: false,
      wikiId: undefined,
      isActive: false,
      schemeAddress: '',
    }
    this.schemes = props.data[0]
    this.proposals = props.data[1]

    this.defaultRemote = (uprtcl.orchestrator.container.get(
      EveesModule.bindings.Config
    ) as any).defaultRemote;

    this.officialRemote = (uprtcl.orchestrator.container.get(
      EveesModule.bindings.EveesRemote
    ) as EveesRemote[]).find(remote => remote.id.includes('eth'));
  }

  componentWillMount() {
    this.load()
  }

  componentDidMount() {
    if (this.container.current == null) return

    this.container.current.addEventListener(
      'evees-proposal-created',
      async (e: any) => {
        this.createProposal({
          methodName: 'authorizeProposal',
          methodParams: [e.detail.proposalId, '1', true],
        })
      },
    )
  }

  async load() {
    this.setState({ loading: true })

    await Promise.all([this.checkIfWikiSchemeExists(), this.checkWiki()])

    this.setState({ loading: false })
  }

  // Check Wiki Scheme
  async checkIfWikiSchemeExists() {
    const genericSchemes = this.schemes.filter(
      (scheme: Scheme) => scheme.staticState.name === 'GenericScheme',
    )
    const states: ISchemeState[] = []
    const getSchemeState = () => {
      return new Promise((resolve, reject) => {
        try {
          genericSchemes.map((scheme: Scheme) =>
            scheme.state().subscribe((state: any) => states.push(state)),
          )
          resolve()
        } catch (e) {
          reject(e)
        }
      })
    }
    await getSchemeState()
    const hasWikiScheme = (schemeState: ISchemeState) => {
      return 'underscore protocol' === schemeName(schemeState, '[Unknown]')
    }
    const wikiSchemeExists = states.some(hasWikiScheme)
    this.setState({ hasWikiScheme: wikiSchemeExists })

    if (wikiSchemeExists) {
      if (
        !(await enableWalletProvider({
          showNotification: this.props.showNotification,
        }))
      ) {
        this.props.showNotification(
          NotificationStatus.Failure,
          'You must be logged in to use Wiki!',
        )
        return
      }
      this.wikiUpdateScheme = states.find(hasWikiScheme)
      this.setState({ isActive: getSchemeIsActive(this.wikiUpdateScheme) })
      this.setState({ schemeAddress: this.wikiUpdateScheme.id })
    }
  }

  async registerWikiScheme() {
    if (
      !(await enableWalletProvider({
        showNotification: this.props.showNotification,
      }))
    ) {
      return
    }

    const checkProposals = (proposal: Proposal) => {
      const state = proposal.staticState as IProposalState
      return state.title === 'Creation of WikiUpdate scheme'
    }

    const wikiProposalAlreadyExists = this.proposals.some(checkProposals)
    const dao = this.props.daoState.address
    const schemeRegistrar = this.schemes.find(
      (scheme: Scheme) => scheme.staticState.name === 'SchemeRegistrar',
    )

    if (wikiProposalAlreadyExists) {
      this.props.showNotification(
        NotificationStatus.Success,
        'Wiki Scheme proposal has already been created!',
      )
      this.props.history.replace(`/dao/${dao}/scheme/${schemeRegistrar.id}`)
    } else {
      const proposalValues = {
        dao,
        type: IProposalType.SchemeRegistrarAdd,
        permissions: '0x' + (17).toString(16).padStart(8, '0'),
        value: 0,
        tags: ['Wiki'],
        title: 'Creation of WikiUpdate scheme',
        description: 'This will allow DAO to have Wiki functionality',
        parametersHash: '0x00000000000000000000000000000000000000000',
        scheme: schemeRegistrar.staticState.address,
        schemeToRegister: '0x0800340862fCA767b3007fE3b297f5F16a441dC8', // rinkeby
      }
      await this.props.createProposal(proposalValues)
    }
  }

  async checkWiki() {
    
    const object: Perspective = {
      creatorId: this.props.daoState.address,
      remote: this.officialRemote.id,
      path: this.props.daoState.address,
      timestamp: 0,
      context: 'home'
    };

    const { id: wikiId } = await deriveSecured<Perspective>(object, this.officialRemote.store.cidConfig);
    
    this.setState({ wikiId: wikiId })
  }

  async createProposal(proposalOptions: IGenericSchemeProposal) {
    const genericSchemeRegistry = new GenericSchemeRegistry()
    const genericSchemeInfo = genericSchemeRegistry.getSchemeInfo(
      (this.wikiUpdateScheme.schemeParams as any).contractToCall,
    )
    const availableActions = genericSchemeInfo.actions()
    const actionCalled = availableActions.find(
      (action: Action) => action.id === proposalOptions.methodName,
    )
    const dataEncoded = genericSchemeInfo.encodeABI(
      actionCalled,
      proposalOptions.methodParams,
    )
    const proposalOptionsDetailed = {
      dao: this.wikiUpdateScheme.dao,
      scheme: this.wikiUpdateScheme.address,
      type: IProposalType.GenericScheme,
      value: 0, // amount of eth to send with the call
      title: actionCalled.label,
      description: actionCalled.description,
      callData: dataEncoded,
    }
    this.props.createProposal(proposalOptionsDetailed)
  }

  renderNoWikiScheme() {
    return (
      <div className={proposalStyle.noDecisions}>
        <img className={proposalStyle.relax} src="/assets/images/yogaman.svg" />
        <div className={proposalStyle.proposalsHeader}>
          Wiki scheme not registered on this DAO yet
        </div>
        <p>You can create the proposal to register it today! (:</p>
        <div className={proposalStyle.cta}>
          <Link to={'/dao/' + this.props.daoState.address}>
            <img className={proposalStyle.relax} src="/assets/images/lt.svg" />{' '}
            Back to home
          </Link>
          <a
            className={classNames({
              [proposalStyle.blueButton]: true,
            })}
            onClick={this.registerWikiScheme}
            data-test-id="createProposal"
          >
            + Register wiki scheme
          </a>
        </div>
      </div>
    )
  }

  renderWiki() {
    return (
      <div
        style={{
          marginTop: '-31px',
          minHeight: 'calc(100vh - 241px)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <module-container
          style={{ flexGrow: '1', flexDirection: 'column', display: 'flex' }}
        >
          <wiki-drawer
            uref={this.state.wikiId}
            default-remote={this.defaultRemote.id}
          ></wiki-drawer>
        </module-container>
      </div>
    )
  }

  public render() {
    let content: any

    if (this.state.loading) {
      content = <h1>Loading</h1>
    } else if (!this.state.hasWikiScheme) {
      content = this.renderNoWikiScheme()
    } else {
      content = this.renderWiki()
    }

    return (
      <div>
        <div className={daoStyle.daoHistoryHeader}>Wiki</div>
        <div ref={this.container}>{content}</div>
      </div>
    )
  }
}

const SubscribedDaoWiki = withSubscription({
  wrappedComponent: DaoWiki,
  loadingComponent: <Loading />,
  errorComponent: (props: any) => <span>{props.error.message}</span>,
  checkForUpdate: [],
  createObservable: async (props: IExternalProps) => {
    const dao = props.daoState.dao
    return combineLatest(
      dao.schemes({}, { fetchAllData: true }),
      dao.proposals(
        { where: { stage: IProposalStage.Queued } },
        { subscribe: true, fetchAllData: true },
      ),
    )
  },
})

export default connect(null, mapDispatchToProps)(SubscribedDaoWiki)
