const Bluebird = require("bluebird");
const req = Bluebird.promisify(require("request"));
// const WebSocket = require('ws');
const W3CWebSocket = require('websocket').w3cwebsocket;

const hashMapper = {
    "Asset:602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7": "GAS",
    "Asset:c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b": "NEO",
};

module.exports = {
    supported_address: [ "NEO" ],

    check(addr) {
        return RegExp('^A[0-9a-zA-Z]{33}$').test(addr);
    },
    
    symbol() {
        return "NEO";
    },

    fetch(addr) {
        return new Promise((accept) => {
            var ws = new W3CWebSocket('wss://neotracker.io/graphql', "graphql-ws");
            
            const sendMessage = (() => {
                ws.send(JSON.stringify({"type":"GQL_START","id":"2","query":{"id":"12","variables":{"hash":addr}},"span":{}}));
                ws.send(JSON.stringify({"type":"GQL_START","id":"2","query":{"id":"12","variables":{"hash":addr}},"span":{}}));
            });

            ws.onopen = sendMessage;
            
            ws.onmessage = (e => {
                const data = JSON.parse(e.data);
                if (data.id === "2" && data.type != "GQL_SUBSCRIBE_ERROR" && !data.value.errors) {
                    const mapped = data.value.data.address.coins.edges.map(coin => {
                        return {
                            asset: hashMapper[coin.node.asset.id] || coin.node.asset.symbol,
                            quantity: parseFloat(coin.node.value)
                        };
                    })
                    accept(mapped);
                    ws.close();
                }
            });
        });
    }
};

