import * as React from 'react'
import { IProposalState } from '@daostack/arc.js'
import { uprtcl } from '../../../index'

import { GenericSchemeInfo } from 'genericSchemeRegistry'
import { EveesBindings, EveesRemote } from '@uprtcl/evees'

interface IProps {
  genericSchemeInfo: GenericSchemeInfo
  detailView?: boolean
  proposal: IProposalState
  transactionModal?: boolean
}

interface IState {
  uprtclProposalId: string
  remoteId: string
}

export default class ProposalSummaryWiki extends React.Component<
  IProps,
  IState
> {
  action: any

  constructor(props: IProps) {
    super(props)
    this.state = {
      uprtclProposalId: undefined,
      remoteId: undefined,
    }
  }

  async componentDidMount() {
    const {
      proposal,
      detailView,
      genericSchemeInfo,
      transactionModal,
    } = this.props
    console.log(detailView)
    console.log(transactionModal)

    let decodedCallData: any
    try {
      decodedCallData = genericSchemeInfo.decodeCallData(
        proposal.genericScheme.callData,
      )
    } catch (err) {
      if (err.message.match(/no action matching/gi)) {
        return <div>Error: {err.message} </div>
      } else {
        throw err
      }
    }

    const eveesEthereum = uprtcl.orchestrator.container
      .getAll(EveesBindings.EveesRemote)
      .find((provider: EveesRemote) =>
        provider.id.startsWith('eth'),
      ) as EveesRemote

    this.action = decodedCallData.action
    this.setState({
      uprtclProposalId: decodedCallData.values[0],
      remoteId: eveesEthereum.id,
    })
  }

  public render(): RenderOutput {
    const style: any = !this.props.detailView
      ? { maxHeight: '300px', overflowY: 'auto' }
      : {}
    if (!this.action) return <h1>Loading</h1>
    switch (this.action.id) {
      case 'authorizeProposal': {
        return (
          <div style={style}>
            <module-container>
              <evees-proposal-diff
                remote-id={this.state.remoteId}
                proposal-id={this.state.uprtclProposalId}
              ></evees-proposal-diff>
            </module-container>
          </div>
        )
      }
      default:
        return ''
    }
  }
}
