#!/usr/bin/python
#-*- coding: utf-8 -*-

__author__ = 'mm'


from flask import Flask, abort, render_template
import json


class ReverseProxied(object):
    def __init__(self, app, script_name):
        self.app = app
        self.script_name = script_name

    def __call__(self, environ, start_response):
        environ['SCRIPT_NAME'] = self.script_name
        return self.app(environ, start_response)


app = Flask(__name__)
app.wsgi_app = ReverseProxied(app.wsgi_app, script_name='/lya')

JSON_FN = "/home/pi/app/lya/lya.json"


@app.route("/", methods=['GET'])
def lya():
    return render_template('lya.html', title="Viltstigen")


@app.route("/lya_data", methods=['GET'])
def lya_data():
    try:
        with open(JSON_FN, "r") as f:
            db = json.load(f)
            return db
    except FileNotFoundError:
        abort(404)


if __name__ == '__main__':
    app.run(debug=True)
