#-----------------------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See LICENSE in the project root for license information.
#-----------------------------------------------------------------------------------------

from flask import Flask, jsonify, request
from flask import send_from_directory
from price import price
import json

app = Flask(__name__)

@app.route("/", methods=['GET'])
def send_root():
    return send_request('index.html')

@app.route('/<path:path>', methods=['GET'])
def send_report(path):
    return send_request(path)

def send_request(path):
    domain = request.headers['Host']
    if domain.startswith(('zam.altsoft.pl', '4.mtaxi.eu', '5219191.mtaxi.eu', '5219191.mtaxi4u.pl', 'byzt.mtaxi.eu', 'komfort.mtaxi.eu', 'ok.mtaxi.eu', 'rtcclub.altsoft.pl')):
        if path.endswith(('.jpg', '.txt')):
            domain = domain.split(':')[0] if domain.find(':') else domain
            r = send_from_directory('static/zam/' + domain, path)
        else:
            r = send_from_directory('static/zam', path)
    else:
        r = send_from_directory('static', path)
    return r

@app.route("/price", methods=['POST'])
@app.route("/cgi-bin/price.py", methods=['POST'])
def count_price():
    request_data = request.get_json()
    domain = request.headers['Host']
    domain = domain.split(':')[0] if domain.find(':') else domain
    citytxt = open(f'static/zam/{domain}/city.txt', 'r').read().rstrip()
    with open(f'static/zam/{domain}/param.py') as file:
        param = json.load(file)
    response = price(request_data, citytxt, param)
    return jsonify(response)

