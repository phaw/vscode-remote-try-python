#-----------------------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See LICENSE in the project root for license information.
#-----------------------------------------------------------------------------------------

from flask import Flask, request
from flask import send_from_directory


app = Flask(__name__)

#@app.route("/")
#def hello():
#    print(f'ROOT')
#    return app.send_static_file("index.html")

@app.route("/", methods=['GET'])
def send_root():
    return send_request('index.html')

@app.route('/<path:path>', methods=['GET'])
def send_report(path):
    return send_request(path)

def send_request(path):
    domain = request.headers['Host']
    print(f'{domain}  => {path}')
    if domain.startswith(('zam.altsoft.pl', '4.mtaxi.eu', '5219191.mtaxi.eu', '5219191.mtaxi4u.pl', 'byzt.mtaxi.eu', 'komfort.mtaxi.eu', 'ok.mtaxi.eu', 'rtcclub.altsoft.pl')):
        #RewriteRule "^/price$" "/cgi-bin/price.py"
        if path.endswith(('.js', '.gif', '.jpg', '.txt')):
            domain = domain.split(':')[0] if domain.find(':') else domain
            print(f'SPEC:{domain}')
            r = send_from_directory('static/zam/' + domain, path)
        else:
            print(f'DFLT:{domain}')
            r = send_from_directory('static/zam', path)
    else:
        r = send_from_directory('static', path)
    return r

@app.route("/price", methods=['POST'])
@app.route("/cgi-bin/price.py", methods=['POST'])
def count_price():
    print('PRICE')
    print(request.form)
    #mode = request.form['mode'] if 'mode' in request.form else "async"
    return '<h1>ROOT</h2>'

