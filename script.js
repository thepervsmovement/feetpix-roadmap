Highcharts.theme = {
    colors: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572',
             '#FF9655', '#FFF263', '#6AF9C4'],
    chart: {
        backgroundColor: {
            linearGradient: [0, 0, 500, 500],
            stops: [
                [0, 'rgb(255, 255, 255)'],
                [1, 'rgb(240, 240, 255)']
            ]
        },
    },
    title: {
        style: {
            color: '#000',
            font: 'bold 16px "Trebuchet MS", Verdana, sans-serif'
        }
    },
    subtitle: {
        style: {
            color: '#666666',
            font: 'bold 12px "Trebuchet MS", Verdana, sans-serif'
        }
    },
    legend: {
        itemStyle: {
            font: '9pt Trebuchet MS, Verdana, sans-serif',
            color: 'black'
        },
        itemHoverStyle:{
            color: 'gray'
        }
    }
};
Highcharts.setOptions(Highcharts.theme);

async function retrieveData() {
    return window.receivedData = await (await fetch("http://ec2-3-120-40-8.eu-central-1.compute.amazonaws.com/response.json")).json();
}

function formatDate(timestamp) {
    var date = new Date(timestamp * 1000);
    var text = date.getFullYear();
    text += "-";
    text += date.getMonth() + 1;
    text += "-";
    text += date.getDate();
    return text;
}

function cleanRateData() {
    var cleanedData = {};
    var events = window.receivedData.events;
    for(var event of events) {
        var dateFormat = formatDate(event.timestamp);
        (cleanedData[dateFormat] = cleanedData[dateFormat] || {
            dateFormat,
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
            type: 'spline'
        },
        title: {
            text: 'Burning Rate'
        },
        xAxis: {
            categories: cleanedData.map(it => it.dateFormat)
        },
        yAxis: {
            title: {
                text: 'NFTs Burned'
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
            text: 'Total Supply'
        },
        xAxis: {
            categories: ["2023-01-07", ...cleanedData.map(it => it.dateFormat)]
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
            visible : false,
            categories: window.receivedData.floorPrices.map(it => new Date(it.timestamp).toString())
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
                    name : (it.floor_price + " ETH"),
                    y : it.floor_price
                }))
            }
        ]
    };
    const chart = Highcharts.chart('floorPrice', chartOptions);
}

document.addEventListener('DOMContentLoaded', main);