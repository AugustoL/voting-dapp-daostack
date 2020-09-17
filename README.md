# DXcongress

This app is a fork of alchemy, an app to work with DAOstack DAOs, this fork is focused on providing a more simple, autonomous and decentralized experience than https://alchemy.daostack.io/ and just for DXdao.

This is an open-source project under GPL 3.0 License, we invite you to fork it and collaborate :).

## Differences from Alchemy

- The app is designed to work only for one DAO.
- No analytics.
- No disqus widget.
- Simpler UI.
- Hash reactjs router-dom.
- Less components in source code.
- More optimized builds.
- No cookies warning.
- No terms and conditions.

## Dependencies:
* [NVM](https://github.com/creationix/nvm#installation) can be helpful to manage different versions of node
* [NodeJS 12.6.2 or greater + NPM](https://github.com/creationix/nvm#usage)

## Installation

```sh
sudo apt-get install -y libsecret-1-dev
git clone https://github.com/AugustoL/voting-dapp-daostack.git
cd voting-dapp-daostack
npm ci
```

## Run with DXdao config

```sh
npm run start-mainnet
```

## Working with docker

The easiest way to start developing is to work with docker.
Here is a quick setup; there are more detailed instructions in [here](./docs/development.md).

After you have installed docker, run the following command to spin up ganache (with the migrated contracts), the graph-node server:
```sh
docker-compose up graph-node
```

Now, in a separate terminal run the following command to run dxdao-alchemy:
```sh
npm run start
```

At this point you should be able to access dxdao-alchemy on http://127.0.0.1:3000.

See [working with docker](./docs/docker.md) for details and troubleshooting.

## Interacting with your test instance using MetaMask

1. Install and enable [MetaMask extension](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) in Chrome
1. Click on the MetaMask extension icon in the toolbar and log in
1. Click on the avatar icon in the top right, and choose "Import Account"
1. Choose "Private Key" and paste the string `0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d` and click "Import"
1. Give it a name like "Alchemy Test Account" so you won't get confused later
1. If you need more than one test account you can also import these private keys: `0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1`, `0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c` and `0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913`. Make sure to give them all differnent names.
1. Make sure that Metamask is connected to `127.0.0.1:8545` (choose from the "Networks" picklist in Metamask)
1. Go to http://127.0.0.1:3000 to load Alchemy

## Adding custom landing page content for your DAO

Just submit a PR to https://github.com/daostack/alchemy with your desired changes in src/customDaoInfo.tsx.  You may supply plain text or HTML inside of parentheses.  The HTML may contain React.js components, most notably `Link` which will cleanly navigate to pages within Alchemy.
