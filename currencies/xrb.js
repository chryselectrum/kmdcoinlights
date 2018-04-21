// Generated by CoffeeScript 2.2.0
var XRB;

function getTime(){
    return new Date(Date.now());
}

XRB = class XRB {
  constructor() {
    this.baseUrls = ['http://txscl.meshbits.io/', 'http://txscl000.meshbits.io/', 'https://kmd.explorer.supernet.org/'];
	this.baseUrl = "https://kmd.explorer.supernet.org/";		
	
	//this.socketUrl = "wss://kmd.explorer.supernet.org/socket.io/"			
    this.ws = null;    
    this.txApi = this.baseUrl + "api/tx/";
    this.blockApi = this.baseUrl + "api/block/";
    this.txFees = [0.000224, 0.0005];
    this.txFeeTimestamp = 0;
    this.txFeeInterval = 3000; // how often to query for a fee
    this.donationAddress = "LiVcWyeoPXNYekcdFkDr64QLG3u9G8BgLs";
  }    

  start(txCb, blockCb) {    
	
	var sockets = [null, null];		
	var baseLength = this.baseUrls.length;
	//console.log('url length: ' + baseLength);
	//console.log(sockets);
	for (var i = 0; i < baseLength; i++)	
	{	
		//console.log('i: ' + i + ', baseUrl: ' + this.baseUrls[i]);		
		if (i >= baseLength) 
			return;	
		var socket = io(this.baseUrls[i],{ forceNew: true });
		
		console.log(socket);
		socket.on('connect', function () {
			socket.emit('subscribe', 'inv');
		});
		socket.on('block', function (block) {
			console.log('onBlock event fired: ' + getTime() + ', ' + block + ', block data:');
			console.log(block);
			return blockCb({ count: block ? block.length : 0 });
		});
		socket.on('tx', function (payload) {
			console.log('onTx event fired: ' + getTime() + ', vout: ' + payload.valueOut);		
			return txCb({
				amount: !isNaN(parseFloat(payload.valueOut)) && isFinite(payload.valueOut) ? payload.valueOut : 0,
				fee: 0, // Math.random() * Math.abs(this.txFees[0] - this.txFees[1]) + Math.min.apply(0, this.txFees),
				link: this.baseURL + 'tx/' + payload.txid,
				donation: !!payload.vout.find((vout) => {
				  return Object.keys(vout)[0] === this.donationAddress;
				})
			});				
		});
		sockets[i] = socket;
	}
	//console.log(sockets);		
	
		
	/*	
	if (this.ws) {
      this.stop();
    }
	
    this.ws = new WebSocket(this.socketUrl);
    this.ws.onclose = () => {
      return setTimeout((() => {
        return this.start(txCb, blockCb);
      }), 1000);
    };
    this.ws.onopen = () => {
      this.ws.send('2probe');
      this.ws.send('5');
      this.ws.send('420["subscribe","sync"]');
      this.ws.send('421["subscribe","inv"]');
      this.ws.send('422["subscribe","sync"]');
      this.ws.send('424["subscribe","sync"]');
      this.ws.send('425["subscribe","inv"]');
      return this.ping = setInterval((() => {
        return this.ws.send('2');
      }), 25 * 1000);
    };
    return this.ws.onmessage = ({data}) => {	  
	  //console.log('transaction data:')		
	  console.log({data})
      var payload, type;
      data = data.match(/^\d+(\[.+?)$/);
      if (data) {
        [type, payload] = JSON.parse(data[1]);
        if (type === 'tx') {
          // fetch fees every now and then
          if (new Date().getTime() - this.txFeeInterval > this.txFeeTimestamp) {
            $.get(this.txApi + payload.txid, ({fees}) => {
              if (fees) {
                this.txFees.shift();
                this.txFees.push(fees);
                return this.txFeeTimestamp = new Date().getTime();
              }
            });
          }
          return typeof txCb === "function" ? txCb({
            amount: payload.valueOut,
            fee: Math.random() * Math.abs(this.txFees[0] - this.txFees[1]) + Math.min.apply(0, this.txFees),
            link: this.baseURL + 'tx/' + payload.txid,
            donation: !!payload.vout.find((vout) => {
              return Object.keys(vout)[0] === this.donationAddress;
            })
          }) : void 0;
        } else {
          return $.get(this.blockApi + payload, ({tx}) => {
            return typeof blockCb === "function" ? blockCb({
              count: tx ? tx.length : 0
            }) : void 0;
          });
        }
      }
    };
	*/
  }

  stop() {
    this.ws.close();
    clearInterval(this.ping);
    return this.ws = null;
  }

};

//# sourceMappingURL=xrb.js.map
