import * as React from "react";
import * as css from "./ProviderConfigButton.scss";
import Tooltip from "rc-tooltip";

interface IExternalProps {
  providerName: string;
  provider: any;
}

export default class ProviderConfigButton extends React.Component<IExternalProps, null> {

  public render(): RenderOutput {
    return <Tooltip placement="bottom" trigger={["hover"]} overlay={`Open ${this.props.providerName} configuration`}>
      <button className={css.button}>
        <img src="assets/images/gear.svg"/>
      </button>
    </Tooltip>;
  }
}
