/*jshint esversion: 6*/
import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import { Button, Form, Grid } from 'react-bootstrap';

import lib_ipfs from './lib_ipfs';
import lib_web3 from './lib_web3';
import lib_contract from './lib_contract';
import sha256coder from './lib_hash';

class App extends Component {
  constructor () {
    super();
    // define our states to keep track
    this.state = {
      ipfs_metadata: ''
    };

    // The order/index in these queue matters
    this.idx_queue = []; // keep track of duplicates
    this.file_queue = [];
    this.ipfshash_queue = [];

    this.captureFileAndMetadata = this.captureFileAndMetadata.bind(this);
    this.saveToIpfs = this.saveToIpfs.bind(this);
    this.registerToBC = this.registerToBC.bind(this);
  }

  saveToIpfs (reader, idx) {
    let ipfsId;
    let fsize;
    const tmp_iqueue = this.ipfshash_queue;
    const dqueue = this.idx_queue;
    const buffer = Buffer.from(reader.result);

    lib_ipfs.add(buffer, { progress: (prog) => console.log('IPFS uploaded bytes:' + prog) })
      .then((response) => {
        console.log(response);
        ipfsId = response[0].hash;
        fsize = response[0].size;
        console.log('ipfs hash=' + ipfsId);
        console.log('ipfs fsize=' + fsize);
        tmp_iqueue[idx] = response[0];
        dqueue.push(reader.name);
      }).catch((err) => {
        console.error(err);
        dqueue[idx] = nil;
      });
  }

  captureFileAndMetadata (event) {
    event.stopPropagation();
    event.preventDefault();
    const dqueue = this.idx_queue;
    const tmp_fqueue = this.file_queue;
    const tmp_iqueue = this.ipfshash_queue;
    const func_ptn = this.saveToIpfs;

    const target = event.target;
    const type = target.type;
    const name = target.name;

    if(type === 'text') {
      console.log('Capturing input from ' + name + ' with value = ' + target.value);
      this.setState({
        [name]: target.value
      });
      return;
    } else if(type === 'file') {
      console.log('Detectuser is trying to select files to upload!');
    } else {
      console.log('Detect unknown type=' + type + ' with name=' + name);
      return;
    }

    if(event.target.files) {
      for(let i = 0; i < event.target.files.length; i++) {
        // TODO: track abs-path instaed of fname, duplicate can happen under diff dir
        if(dqueue.includes(event.target.files[i].name, 0)) {
          console.log('Skipping file ' + event.target.files[i].name + ' since it has been uploaded already');
        }
        else {
          let f = event.target.files[i];
          tmp_fqueue.push(f);
          let idx = tmp_fqueue.indexOf(f, 0);
          console.log('Queuing file ' + f.name + ' at index=' + idx);
          // register index for each file and upload order properly
          // TODO: will take up lots of memory for multiple files since we pre-load them all into memory
          let reader = new window.FileReader();
          tmp_iqueue[idx] = ''; // placeholder to avoid race condition
          console.log('Loading file ' + f.name + ' idx=' + idx);
          reader.onload = () => func_ptn(reader, idx);
          reader.readAsArrayBuffer(f); // load file into browser's memory as blob
        }
      }
    }
    else {
      console.log('No file has been uploaded yet!');
    }
  }

  /* jshint ignore:start */
  registerToBC (event) {
    let ipfsmeta = this.state.ipfs_metadata;
    console.log('Submitting with metadata = ' + ipfsmeta);
    event.preventDefault();
    const tmp_fqueue = this.file_queue;
    const tmp_iqueue = this.ipfshash_queue;

    const contract_address= lib_contract.options.address;
    console.log('Identified contract address = ' + contract_address);
    let submit_acct = '';

    try {
      lib_web3.eth.getAccounts( function(err, accounts) { 
        console.log(accounts);
        submit_acct = accounts[0];
        console.log('Applying eth account: ' + submit_acct + ' for contract ' + contract_address);
      });
    }
    catch(error) {
      console.log(error);
    }

    for(let i = 0; i < tmp_fqueue.length; i++) {
      // The metadata file is generated on the fly on IPFS before it gets registered 
      let real_fsize = tmp_iqueue[i].size;
      let ipfs_realhash = '' + tmp_iqueue[i].hash;
      let encrypted_idx = sha256coder(ipfs_realhash);
      let ipfsmid = '';
      let ipfsmeta_json = '{'
      + '"description": ' + ipfsmeta
      + '"filesize": ' + real_fsize
      + '"encrypted": ' + encrypted_idx
      '}';
      let ipfsmeta_norm = JSON.stringify(ipfsmeta_json);
      console.log('File JSON metadata=' + ipfsmeta_norm);
      lib_ipfs.add(Buffer.from(ipfsmeta_norm), { progress: (prog) => console.log('IPFS Metadata uploaded bytes:' + prog) })
      .then((resp) => {
        console.log(resp);
        ipfsmid = resp[0].hash;
        console.log('ipfs metadata hash=' + ipfsmid);
        console.log('Submitted file=' + tmp_fqueue[i].name);
        console.log('IPFS record=https://ipfs.io/ipfs/' + ipfsmid);
        console.log('Registering: ipfsMetadata=' + ipfsmid + ' encryptedIdx=' + encrypted_idx + ' ipfsHash=' + ipfs_realhash + ' realFsize=' + real_fsize);
        console.log('Submitting from ' + submit_acct);
        lib_contract.methods.encryptIPFS(ipfsmid, encrypted_idx, ipfs_realhash, real_fsize).send({
          from: submit_acct
        }, (error, transactionHash) => {
          console.log(transactionHash);
        }); //submit to contract 
      }).catch((err) => {
        console.error(err);
      }); // end of current file submission and registration
    } // end of for loop
  } // end of registerToBC
  /* jshint ignore:end */

  /* jshint ignore:start */
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1>IPFS Register</h1>
        </header>
        <p className="App-intro">
          To get started, click on button <code>Browse</code> to upload files.
        </p>
        <p>
          When you have completed uploading files and entering descriptions, click on <code>Register on BlockChain</code> to claim your reward.
        </p>
        <Grid>
          <Form onSubmit={this.registerToBC}>
            <p>
            The better you describe your files, the easier others can discover and find it.
            </p>
            <p>
            This helps to increase the chances of rewards and incentives to use your files.
            </p>
            <label>
            Enter file description:
            <input type="text" name="ipfs_metadata" placeholder="Enter your description here!"
              size="140"
              value={this.state.ipfs_metadata}
              onChange = {this.captureFileAndMetadata}
            />
            </label>
            <p></p>
            <input 
              type = "file"
              multiple
              onChange = {this.captureFileAndMetadata}
            />
            <Button 
                bsStyle="primary" 
                type="submit"> 
                Register on BlockChain 
            </Button>
          </Form>
        </Grid>
      </div>
    );
  };
  /* jshint ignore:end */
}

export default App;