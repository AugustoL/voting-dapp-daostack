import { IDAOState } from "@daostack/arc.js";
import * as React from "react";
import * as css from "./DaoLandingPage.scss";

type IExternalProps = {
  daoState: IDAOState;
};

type IProps = IExternalProps;

export default class DaoLandingPage extends React.Component<IProps> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      showingEditPagePopup: false,
    };
  }

  public render() {
      return(
        <div className={css.landingPage}>
          <iframe src="https://gateway.pinata.cloud/ipfs/QmPhoeL14E5SBFBaC4bA3nuRpg3MpxdWVYdPrdXHdQ3EHY">
          </iframe>
        </div>
      )
  }
}
