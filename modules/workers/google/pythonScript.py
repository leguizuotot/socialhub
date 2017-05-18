

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.detach(), encoding='utf-8')

#
API_KEY = 'AIzaSyA6lCc9A7qQ56gmkC1ms8jqLl_v7uWGSXs'

#
# import json
# result = json.loads('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=40.597181,0.443250&radius=5000&types=bar|restaurant|cafe&key=AIzaSyAhaD4HwgofkA2_9Z7fLbGB1V8Shi-S7do')  # result is now a dict
# print(result)


# import json, requests


import json
import urllib.request
import pandas as pd
import numpy as np
import datetime
import sqlalchemy as sa
import pyodbc
import os
from time import sleep

dir_path = os.path.dirname(os.path.realpath(__file__))
os.chdir(dir_path)

with open("input\\centroides_municipio.json") as json_file:
    json_data = json.load(json_file)
centroides = pd.DataFrame(json_data)

with open("input\\centroides_cod_censal.json") as json_file:
    json_data = json.load(json_file)
centroides = pd.concat([centroides,pd.DataFrame(json_data)])

with open("input\\centroides_cod_postal.json") as json_file:
    json_data = json.load(json_file)
centroides = pd.concat([centroides,pd.DataFrame(json_data)])


# output_dict = [x for x in json_data if x['municipio'] == 'barcelona']
# centroides_cod_censal_barcelona = list(map((lambda x: x['latlon']), output_dict))


def googleNearby(latlon, types, APIkey):
    "This prints a passed string into this function"
    url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?rankby=distance&location=' + \
        latlon + '&types=' + types + '&key=' + APIkey
    response = urllib.request.urlopen(url)
    jsonRaw = response.read().decode('utf-8')
    return json.loads(jsonRaw)


def googleNextPageToken(next_page_token, APIkey):
    url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=' + \
        next_page_token + '&key=' + APIkey
    response = urllib.request.urlopen(url)
    jsonRaw = response.read().decode('utf-8')
    return json.loads(jsonRaw)


def handleResponse(jsonData):
    cols = ['place_id', 'name', 'rating', 'lat', 'lng', 'vicinity', 'datetime']
    df = pd.DataFrame(jsonData['results'])
    lat = list(
        map((lambda pdv: pdv['geometry']['location']['lat']), jsonData['results']))
    lng = list(
        map((lambda pdv: pdv['geometry']['location']['lng']), jsonData['results']))
    df['lat'] = np.asarray(lat)
    df['lng'] = np.asarray(lng)
    df['datetime'] = datetime.datetime.utcnow()
    df = df[cols]
    return df


def saveToSQL(dataframe):
    engine = sa.create_engine(
        'mssql+pyodbc://zSocialHub:M1nsa1t39@tsp02.cloudapp.net/zSocialHub?driver=SQL+Server+Native+Client+11.0')
    dataframe.to_sql(name='DM_SOURCE_GOOGLE_RAW', con=engine,
                     if_exists='append', index=False)


def getGoogleResults(latlon, cluster, types, APIkey):
    jsonData = googleNearby(latlon, types, APIkey)
    df = handleResponse(jsonData)
    # saveToSQL(df)
    print('Fetch results...' + latlon)
    sys.stdout.flush()
    sleep(2)
    i = 0
    while 'next_page_token' in jsonData:
        i = i +1
        jsonData = googleNextPageToken(jsonData['next_page_token'], APIkey)
        dfAUX = handleResponse(jsonData)
        df = pd.concat([df,dfAUX])
        # saveToSQL(df)
        print('Fetching next_page_token '+ str(i))
        sys.stdout.flush()
        sleep(2)
    print('Saving to SQL ' + str(len(df)) +' POIs')
    df['cluster'] = cluster
    saveToSQL(df)



# latlon = '40.597181,0.443250'
# types = 'bar|restaurant|cafe'
# print(centroides_municipio)
# centroides_cod_censal_reduced = centroides_cod_censal[0:4]

# print(centroides)

for index, centroide in centroides.iterrows():
    latlon = centroide['latlon'].replace(" ", "")
    cluster = str(index) + '|' + latlon + '|' +centroide['type']
    print(cluster)
    # print(indexCentroide)
    # sleep(2)

# for centroide in centroides_cod_censal_barcelona:
#     getGoogleResults(centroide.replace(" ", ""), types, API_KEY)
#     sleep(2)
