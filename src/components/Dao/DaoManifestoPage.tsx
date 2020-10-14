import * as React from "react";
import * as css from "./ManifestoPage.scss";

export default class DaoManifestoPage extends React.Component {

  public render() {
      return(
        <div className={css.manifestoPage}>
          <iframe src="https://ipfs.io/ipfs/QmfGgQYwL4ZrXLVshYuwH2WHeSvPFQCDXeYTzPPFReCJqJ">
          </iframe>
        </div>
      )
  }
}
