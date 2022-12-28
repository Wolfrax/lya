function plot() {
    $.getJSON('/lya/lya_data', function (json) {
        console.log(json);
        let sensor1 = {'temp': [], 'hum': []};
        let sensor2 = {'temp': [], 'hum': []};
        let temp = 0;
        let sensor1_maxmin = {
            'maxtemp': [-Number.MAX_VALUE, ""], 'mintemp': [Number.MAX_VALUE, ""],
            'maxhum': [-Number.MAX_VALUE, ""], 'minhum': [Number.MAX_VALUE, ""],
        };
        let sensor2_maxmin = {
            'maxtemp': [-Number.MAX_VALUE, ""], 'mintemp': [Number.MAX_VALUE, ""],
            'maxhum': [-Number.MAX_VALUE, ""], 'minhum': [Number.MAX_VALUE, ""],
        };


        json.Sensor1.forEach(function (elem) {
            let ts = new Date(elem.time);
            ts = ts.getTime() - ((ts.getTimezoneOffset()) * 60 * 1000);
            temp = Math.round(elem.temperature_C * 10) / 10;
            sensor1['temp'].push([ts, temp]);
            sensor1['hum'].push([ts, elem.humidity]);

            if (temp >= sensor1_maxmin['maxtemp'][0]) {
                sensor1_maxmin['maxtemp'] = [temp, elem.time];
            }
            if (temp <= sensor1_maxmin['mintemp'][0]) {
                sensor1_maxmin['mintemp'] = [temp, elem.time];
            }

            if (elem.humidity >= sensor1_maxmin['maxhum'][0]) {
                sensor1_maxmin['maxhum'] = [elem.humidity, elem.time];
            }
            if (elem.humidity <= sensor1_maxmin['minhum'][0]) {
                sensor1_maxmin['minhum'] = [elem.humidity, elem.time];
            }
        });
        chart("Sensor1",
            "Orangerie (" + temp + "°C, " + json.Sensor1[json.Sensor1.length - 1].humidity + "% @ " +
            json.Sensor1[json.Sensor1.length - 1].time + ")",
            sensor1);

        $("#Sensor1_Max").html(
            "Max temp (" + sensor1_maxmin['maxtemp'][1] + "): " + sensor1_maxmin['maxtemp'][0] + "°C, " +
            "Max hum (" + sensor1_maxmin['maxhum'][1] + "): " + sensor1_maxmin['maxhum'][0] + "%");

        $("#Sensor1_Min").html(
            "Min temp (" + sensor1_maxmin['mintemp'][1] + "): " + sensor1_maxmin['mintemp'][0] + "°C, " +
            "Min hum (" + sensor1_maxmin['minhum'][1] + "): " + sensor1_maxmin['minhum'][0] + "%");


        json.Sensor2.forEach(function (elem) {
            let ts = new Date(elem.time);
            ts = ts.getTime() - ((ts.getTimezoneOffset()) * 60 * 1000);
            temp = Math.round(elem.temperature_C * 10) / 10;
            sensor2['temp'].push([ts, temp]);
            sensor2['hum'].push([ts, elem.humidity]);

            if (temp >= sensor2_maxmin['maxtemp'][0]) {
                sensor2_maxmin['maxtemp'] = [temp, elem.time];
            }
            if (temp <= sensor2_maxmin['mintemp'][0]) {
                sensor2_maxmin['mintemp'] = [temp, elem.time];
            }

            if (elem.humidity >= sensor2_maxmin['maxhum'][0]) {
                sensor2_maxmin['maxhum'] = [elem.humidity, elem.time];
            }
            if (elem.humidity <= sensor2_maxmin['minhum'][0]) {
                sensor2_maxmin['minhum'] = [elem.humidity, elem.time];
            }
        });
        chart('Sensor2',
            "Sensor 2 (" + temp + "°C, " + json.Sensor2[json.Sensor2.length - 1].humidity + "% @ " +
            json.Sensor2[json.Sensor2.length - 1].time + ")",
            sensor2);

        $("#Sensor2_Max").html(
            "Max temp (" + sensor2_maxmin['maxtemp'][1] + "): " + sensor2_maxmin['maxtemp'][0] + "°C, " +
            "Max hum (" + sensor2_maxmin['maxhum'][1] + "): " + sensor2_maxmin['maxhum'][0] + "%");

        $("#Sensor2_Min").html(
            "Min temp (" + sensor2_maxmin['mintemp'][1] + "): " + sensor2_maxmin['mintemp'][0] + "°C, " +
            "Min hum (" + sensor2_maxmin['minhum'][1] + "): " + sensor2_maxmin['minhum'][0] + "%");

    });
}


function chart(id, title, data) {
        Highcharts.chart(id, {
            legend: {
                align: 'left',
                verticalAlign: 'top',
                borderWidth: 0
            },

            plotOptions: {
                series: {
                    cursor: 'pointer',
                    className: 'popup-on-click',
                    marker: {
                        lineWidth: 1
                    }
                }
            },

            series: [
                {
                    yAxis: 0,
                    name: 'Temperature',
                    data: data['temp'],
                    color: 'gray',
                    tooltip: {valueSuffix: '°C'},
                },
                {
                    yAxis: 1,
                    name: 'Humidity',
                    data: data['hum'],
                    color: '#6CF',
                    tooltip: {valueSuffix: '%'},
                }],

            title: {
                text: title,
                align: 'left'
            },

            tooltip: {
                shared: true,
                crosshairs: true
            },

            xAxis: {
                type: 'datetime',
                tickWidth: 0,
                gridLineWidth: 1,
            },

            yAxis: [{
                title: {
                    text: 'Temperature (°C)',
                    style: {color: 'gray'},
                },
                showFirstLabel: false
            }, {
                title: {
                    text: 'Humidity (%)',
                    style: {color: '#6CF'},
                },
                showFirstLabel: false,
                opposite: true,
            }]
        });
}