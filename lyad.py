#!/usr/bin/env python3

"""Custom data handling example for rtl_433's HTTP (line) streaming API of JSON events."""

# Start rtl_433 (`rtl_433 -F http`), then this script.
# Needs the Requests package to be installed.

import requests
import json
from time import sleep
from datetime import datetime, timedelta
import logging
from logging.handlers import RotatingFileHandler


_LOGGER = logging.getLogger(__name__)
_LOGGER.setLevel(logging.DEBUG)

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

handler = RotatingFileHandler(filename='lyad.log', maxBytes=2000000, backupCount=5)
handler.setFormatter(formatter)
handler.setLevel(logging.DEBUG)
_LOGGER.addHandler(handler)

http_handler = logging.handlers.HTTPHandler('rpi2.local:3000', '/log', method='POST',)
http_handler.setLevel(logging.DEBUG)
_LOGGER.addHandler(http_handler)

# You can run rtl_433 and this script on different machines,
# start rtl_433 with `-F http:0.0.0.0`, and change
# to e.g. `HTTP_HOST = "192.168.1.100"` (use your server ip) below.
HTTP_HOST = "127.0.0.1"
HTTP_PORT = 8433

JSON_FN = "/home/pi/app/lya/lya.json"


def stream_lines():
    url = f'http://{HTTP_HOST}:{HTTP_PORT}/stream'
    headers = {'Accept': 'application/json'}

    # You will receive JSON events, one per line terminated with CRLF.
    # On Events and Stream endpoints a keep-alive of CRLF will be sent every 60 seconds.
    try:
        response = requests.get(url, headers=headers, timeout=70, stream=True)
        _LOGGER.info(f'Connected to {url}')

        for chunk in response.iter_lines():
            yield chunk
    except requests.exceptions.Timeout:
        _LOGGER.warning(f'{url} timeout')
        pass


def handle_event(line, db):
    try:
        # Decode the message as JSON
        data = json.loads(line)

        # data:
        # {'time': '2022-12-18 19:20:37', 'model': 'Bresser-3CH', 'id': 250, 'channel': 2, 'battery_ok': 1,
        # 'temperature_C': 19.16667, 'humidity': 34, 'mic': 'CHECKSUM'}
        #

        # Round to minute
        tm = datetime.strptime(data['time'], '%Y-%m-%d %H:%M:%S.%f')
        tm = tm.replace(second=0, microsecond=0) + timedelta(minutes=tm.second // 30)
        data['time'] = tm.strftime('%Y-%m-%d %H:%M:%S')

        if data["model"] == "Bresser-3CH" and data["channel"] == 1:
            label = "Sensor1"
        elif data["model"] == "Bresser-3CH" and data["channel"] == 2:
            label = "Sensor2"
        else:
            label = "Unknown"

        # Note copy a subset of data keys (omitted: 'mic', 'mod', 'freq', 'rssi', 'snr', 'noise')
        data = {key: data[key] for key in ['time', 'protocol', 'description', 'model',
                                           'id', 'channel', 'battery_ok', 'temperature_C', 'humidity']}
        if data not in db[label]:
            db[label].append(data)

        # Remove all elements older than 7 day
        for k in db.keys():
            if db[k]:
                newest = datetime.strptime(db[k][-1]['time'], '%Y-%m-%d %H:%M:%S')
                while (newest - datetime.strptime(db[k][0]['time'], '%Y-%m-%d %H:%M:%S')).days >= 7:
                    db[k] = db[k][1:]

        return db

    except KeyError:
        # Ignore unknown message data and continue
        pass

    except ValueError as e:
        # Warn on decoding errors
        _LOGGER.debug(f'Event format not recognized: {e}')

    finally:
        with open(JSON_FN, "w") as f:
            json.dump(db, f, indent=4)
            f.flush()


def rtl_433_listen():
    """Listen to all messages in a loop forever."""

    try:
        with open(JSON_FN, "r") as f:
            db = json.load(f)
        if not db:
            db = {'Sensor1': [], 'Sensor2': [], 'Unknown': []}
    except FileNotFoundError:
        db = {'Sensor1': [], 'Sensor2': [], 'Unknown': []}

    # Loop forever
    while True:
        try:
            # Open the HTTP (line) streaming API of JSON events
            for chunk in stream_lines():
                chunk = chunk.rstrip()
                if not chunk:
                    # filter out keep-alive empty lines
                    continue
                # Decode the JSON message
                db = handle_event(chunk, db)

        except requests.ConnectionError:
            _LOGGER.info('Connection failed, retrying...')
            sleep(5)


if __name__ == "__main__":
    try:
        rtl_433_listen()
    except KeyboardInterrupt:
        _LOGGER.debug('\nExiting.')
        pass
