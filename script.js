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

var chartOptions =  {
    chart: {
        type: 'spline'
    },
    title: {
        text: 'Burning Rate'
    },
    xAxis: {
        categories: ['Apples', 'Bananas', 'Oranges']
    },
    yAxis: {
        title: {
            text: 'NFTs Burned'
        }
    },
    series: [{
        name: 'Jane',
        data: [1, 0, 4]
    }, {
        name: 'John',
        data: [5, 7, 3]
    }]
};

document.addEventListener('DOMContentLoaded', main);

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

function cleanData() {
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
    var cleanedData = cleanData();
    chartOptions.xAxis.categories = cleanedData.map(it => it.dateFormat);
    chartOptions.series = [
        {
            name : 'Burned',
            data : cleanedData.map(it => it.count)
        }
    ];
    const chart = Highcharts.chart('container', chartOptions);
}