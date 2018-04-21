// Generated by CoffeeScript 2.2.0
var currencies, currencyFormat, initialize, prices, showBlock, showHelp, showTx, stats, updateLanes, updatePrices, updateStats;

currencies = {
  xrb: new XRB(),
  btc: new BTC(),
  eth: new ETH(),
  ltc: new LTC()  
};

prices = {};

stats = {};

currencyFormat = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
};

// render TX
showTx = function(engine, currency, tx) {
  var fee, value;
  value = tx.amount * (prices[currency] || 1);
  fee = tx.fee * (prices[currency] || 1);
  engine.addMeteor({
    speed: fee ? 2 + 4 * Math.min(2, Math.log10(1 + fee)) / 2 : 6,
    hue: value ? 220 - 220 * Math.min(6, Math.log10(1 + value)) / 6 : 220,
    thickness: Math.max(5, Math.log10(1 + value) * 10),
    length: Math.min(3, Math.log10(1 + fee)) / 3 * 250,
    link: tx.link,
    donation: tx.donation
  });
  return updateStats(currency, value, fee);
};

// render block
showBlock = function(engine, currency, block) {
  engine.addBlock(Math.min(250, block.count / 4));
  if (stats[currency] != null) {
    return stats[currency].count = Math.max(0, stats[currency].count - block.count);
  }
};

// get current price
updatePrices = function(currencies) {
  var currencyAPI, marketcapAPI;
  currencyAPI = 'https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=';
  $.get(currencyAPI + currencies.join(',').replace('xrb','kmd').toUpperCase(), function(data) {	
	data['XRB'] = data['KMD']
	//console.log(data);
    var currency, price, results;
    if (data) {
      results = [];
      for (currency in data) {
        price = data[currency];
        currency = currency.toLowerCase();
        prices[currency] = Math.round(1 / price * 100) / 100;
        results.push($(`.${currency} .price`).text(prices[currency].toLocaleString(void 0, {
          style: 'currency',
          currency: 'USD'
        })));
      }
      return results;
    }
  });
  marketcapAPI = 'https://api.coinmarketcap.com/v1/global/';
  $.get(marketcapAPI, function(data) {
    if (data) {
      return $(".marketcap").text(data.total_market_cap_usd.toLocaleString(void 0, currencyFormat));
    }
  });
  return setTimeout(updatePrices.bind(null, currencies), 10 * 1000);
};

// update stats for a currency, called whenever there is a new TX
// to do that, keep a log of the last 60 seconds of tx
updateStats = function(currency, value = 0, fee = 0) {
  var duration, feePerTx, i, last, timestamp, txPerSecond, valuePerTx;
  if (stats[currency] == null) {
    stats[currency] = {
      last: [],
      count: 0
    };
  }
  
  // calculate stats for last 60s
  last = stats[currency].last;
  timestamp = new Date().getTime();
  last.push({timestamp, value, fee});
  i = last.length;
  while (i--) {
    if (timestamp - last[i].timestamp > 60 * 1000) {
      last.splice(i, 1);
    }
  }
  duration = Math.max(last[last.length - 1].timestamp - last[0].timestamp, 1) / 1000;
  txPerSecond = Math.round(last.length / duration * 10) / 10;
  //valuePerSecond = Math.round(stat.reduce(((a, b) -> a + b.value), 0) / duration)
  valuePerTx = Math.round(last.reduce((function(a, b) {
    return a + b.value;
  }), 0) / last.length);
  //feePerSecond = Math.round(stat.reduce(((a, b) -> a + b.fee), 0) / duration * 100)/100
  feePerTx = Math.round(last.reduce((function(a, b) {
    return a + b.fee;
  }), 0) / last.length * 100) / 100;
  return $(`.${currency} .stats`).text(`${txPerSecond.toLocaleString()} tx/s (${stats[currency].count} unconfirmed)\n${valuePerTx.toLocaleString(void 0, currencyFormat)} value/tx\n${feePerTx.toLocaleString(void 0, {
    style: 'currency',
    currency: 'USD'
  })} fee/tx`);
};

// set up a lane
initialize = function(currency) {
  var canvas, container, engine;
  if (currencies[currency] != null) {
    container = $(`.${currency}`);
    container.find("canvas").remove();
    canvas = $('<canvas></canvas>');
    container.append(canvas);
    engine = new CanvasRenderer(canvas.get(0));
    canvas.data('engine', engine);
    if (container.is(':visible')) {
      engine.start();
    }
    currencies[currency].start(showTx.bind(null, engine, currency), showBlock.bind(null, engine, currency));
    // donation links
    if (currencies[currency].donationAddress) {
      return container.find('.donate').on('click', () => {
        $('.overlay .donation').show().siblings().hide();
        return $('.overlay').fadeToggle().find('.address').text(currencies[currency].donationAddress).end().find('.donation img').attr('src', `img/${currency}-qr.png`);
      });
    } else {
      return container.find('.donate').remove();
    }
  }
};

// update lane rendering (for resizing and lane toggling
updateLanes = function() {
  return $(".currencies > div").each(function() {
    var container, engine;
    container = $(this);
    engine = container.find('canvas').data('engine');
    if (container.is(':visible')) {
      engine.resize(container.find('canvas').get(0));
      return engine.start();
    } else {
      return engine.stop();
    }
  });
};

showHelp = function() {
  $('.overlay .help').show().siblings().hide();
  return $('.overlay').fadeIn();
};

// start everything
$(function() {
  // load prices
  updatePrices(Object.keys(currencies));
  // set up overlay
  $('.overlay').on('click', function(e) {
    if ($('.overlay .help').is(':visible')) { // don't show help at the beginning after closing
      document.cookie = `nohelp=true; expires=${new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toString()}; path=/`;
    }
    if ($(e.target).is('.overlay, .help')) {
      return $(this).fadeOut();
    }
  });
  if (!!document.cookie.match(/nohelp/) || !!location.hash.match(/nohelp/i)) {
    $('.overlay').hide();
  }
  if (!!location.hash.match(/nohelp/i)) {
    $('nav').hide();
  }
  // initialize coins
  $('.currencies > div').each(function() {
    return initialize($(this).attr('class'));
  });
  // listen to resizing
  $(window).resize(updateLanes);
  // set up nav
  return $('nav').on('click', '.help', showHelp).on('click', '.right', function() {
    $(".currencies").append($(".currencies > div").first());
    return updateLanes();
  }).on('click', '.left', function() {
    $(".currencies").prepend($(".currencies > div").last());
    return updateLanes();
  });
});

//# sourceMappingURL=main.js.map
