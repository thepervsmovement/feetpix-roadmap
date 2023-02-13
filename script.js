Highcharts.theme = {
    colors: ['#000000', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572',
             '#FF9655', '#FFF263', '#6AF9C4'],
    chart: {
        backgroundColor: '#e6ecf2ec'
    },
    title: {
        style: {
            color: '#000000',
            font: 'bold 16px "Trebuchet MS", Verdana, sans-serif'
        }
    },
    subtitle: {
        style: {
            color: '#ffffff',
            font: 'bold 12px "Trebuchet MS", Verdana, sans-serif'
        }
    },
    legend: {
        itemStyle: {
            font: '9pt Trebuchet MS, Verdana, sans-serif',
            color: 'black'
        },
        itemHoverStyle:{
            color: '#ffffff'
        }
    }
};
Highcharts.setOptions(Highcharts.theme);

async function retrieveData() {
    return window.receivedData = await (await fetch("http://ec2-3-120-40-8.eu-central-1.compute.amazonaws.com/response.json")).json();
}

var months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function formatDate(timestamp) {
    var date = new Date(timestamp);
    var text = months[date.getMonth()];
    text += "-";
    text += date.getDate();
    return text;
}

function groupDate(timestamp) {
    var date = new Date(timestamp);
    var text = date.getFullYear();
    text += "-";
    text += (date.getMonth() + 1);
    text += "-";
    text += date.getDate();
    return text;
}

function cleanRateData() {
    var cleanedData = {};
    var events = window.receivedData.events;
    for(var event of events) {
        var timestamp = event.timestamp * 1000;
        var dateGroup = groupDate(timestamp);
        (cleanedData[dateGroup] = cleanedData[dateGroup] || {
            dateGroup,
            dateFormat : formatDate(timestamp),
            count : 0
        }).count += event.count;
    }
    cleanedData = Object.keys(cleanedData).sort().map(it => cleanedData[it]);
    return cleanedData;
}

async function main() {
    await retrieveData();
    await drawBurningRate();
    await drawSupplyRate();
    await drawFloorPrice();
}

async function drawBurningRate() {
    var cleanedData = cleanRateData();
    var chartOptions =  {
        chart: {
            type: 'bar'
        },
        title: {
            text: '🔥 Feet Burn'
        },
        xAxis: {
            categories: cleanedData.map(it => it.dateFormat)
        },
        yAxis: {
            title: {
                text: 'Burned'
            }
        },
        series: [
            {
                name : 'Burned',
                data : cleanedData.map(it => it.count)
            }
        ]
    };
    const chart = Highcharts.chart('burningRate', chartOptions);
}

async function drawSupplyRate() {
    var cleanedData = cleanRateData();
    var supplies = [window.receivedData.totalSupply, ...cleanedData.map(it => it.count)];
    for(var i = 1; i < supplies.length; i++) {
        supplies[i] = supplies[i-1] - supplies[i];
    }
    var chartOptions =  {
        chart: {
            type: 'spline'
        },
        title: {
            text: '🔥 Available Feet'
        },
        xAxis: {
            categories: ["01-07", ...cleanedData.map(it => it.dateFormat)]
        },
        yAxis: {
            title: {
                text: ''
            }
        },
        series: [
            {
                name : 'Remaining Supply',
                data : supplies
            }
        ]
    };
    const chart = Highcharts.chart('supplyRate', chartOptions);
}

async function drawFloorPrice() {

    var chartOptions =  {
        chart: {
            type: 'spline'
        },
        title: {
            text: 'Floor Price'
        },
        xAxis: {
            visible : true,
            categories: window.receivedData.floorPrices.map(it => formatDate(it.timestamp))
        },
        yAxis: {
            tickPositioner : function() {
                var defaultValues = [0.01, 0.1, 1, 10, 100, 1000];
                var values = [];
                var max = Math.max.apply(window, window.receivedData.floorPrices.map(it => it.floor_price));
                for(var val of defaultValues) {
                    if(max < val && values.length > 1) {
                        break;
                    }
                    values.push(val);
                }
                return values;
            }
        },
        series: [
            {
                name : '',
                data : window.receivedData.floorPrices.map(it => ({
                    name : (`${formatDate(it.timestamp)}: ${it.floor_price} ETH`),
                    y : it.floor_price
                }))
            }
        ]
    };
    const chart = Highcharts.chart('floorPrice', chartOptions);
}

document.addEventListener('DOMContentLoaded', main);