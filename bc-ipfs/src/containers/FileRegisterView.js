import React, { Component } from 'react';
import { Panel, Jumbotron, Button, Alert } from 'react-bootstrap';
import FileRegister from '../components/FileRegister';
import BrowserAlert from '../components/BrowserAlert';
import GetEtherWalletPanel from '../components/panels/GetEtherWalletPanel';
import PurchaseEtherPanel from '../components/panels/PurchaseEtherPanel';
import ExchangeBMDTokensPanel from '../components/panels/ExchangeBMDTokensPanel';
import isMobile from '../utils/lib_user_agent';
import './App.css'; //TODO: defien FileRegisterView own CSS

class FileRegisterView extends Component {
  constructor() {
    super();
  }
  render() {
    /*jshint ignore:start*/
    return (
      <div className="App">
        <header className="App-header">
          <h1>IPFS Register</h1>
        </header>
        <BrowserAlert />
        <GetEtherWalletPanel title="1. Get Ethereum Wallet" />
        <PurchaseEtherPanel title="2. Fund Your Wallet with Ethereum" />
        <Panel bsStyle="primary" defaultExpanded={true}>
          <Panel.Heading>
            <Panel.Title toggle componentClass="h3">
              3. Registering Files
            </Panel.Title>
          </Panel.Heading>
          <Panel.Collapse>
            <Panel.Body>
              <FileRegister />
            </Panel.Body>
          </Panel.Collapse>
        </Panel>
        <Panel bsStyle="primary" defaultExpanded={!isMobile.any()}>
          <Panel.Heading>
            <Panel.Title toggle componentClass="h3">
              4. Have Large Files to upload?
            </Panel.Title>
          </Panel.Heading>
          <Panel.Collapse>
            <Panel.Body>
              <Alert bsStyle="warning" style={{ display: isMobile.any() ? 'block' : 'none' }}>
                <strong>Please use desktop to download the tools. </strong>
              </Alert>
              <p>Download our desktop tool to help you upload large files.</p>
              <p>
                <Button
                  bsStyle="info"
                  href="https://github.com/BlockMedical/BMD-distributed_hosting_projects/blob/master/BMD-OrionUsage.md"
                >
                  See instructions here.
                </Button>{' '}
              </p>
            </Panel.Body>
          </Panel.Collapse>
        </Panel>
        <ExchangeBMDTokensPanel title="5. Exchange BlockMed(BMD) Tokens" />
      </div>
    );
    /*jshint ignore:end*/
  }
}

export default FileRegisterView;
