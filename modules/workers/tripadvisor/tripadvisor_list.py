import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.detach(), encoding='utf-8')

# user_agent = 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_4; en-US) AppleWebKit/534.3 (KHTML, like Gecko) Chrome/6.0.472.63 Safari/534.3'
# headers = { 'User-Agent' : user_agent }
import urllib.request
# import requests #Install certifi for https
from bs4 import BeautifulSoup
import pandas as pd
import sqlalchemy as sa


url = "https://www.tripadvisor.es/Search?geo=187497&pid=3826&redirect=&startTime=&uiOrigin=&q=Restaurantes&returnTo=https%253A__2F____2F__www__2E__tripadvisor__2E__es__2F__Restaurants__2D__g1969684__2D__Province__5F__of__5F__Barcelona__5F__Catalonia__2E__html&searchSessionId=87158BC41B01481CDF5C35613E383AD31495536197797ssid"
p = urllib.request.urlopen(url)
source = p.read()
p.close()
soup = BeautifulSoup(source, "html.parser")




def getEateryNamesAndURLs(section_url):
    """
    Gets the data on one page of the url (page specified by section url)
    Returns a list of all NUM_PER_PAGE restaurent names on the page specified
    Each name is paired with the url stub of the restaurent
    """
    html = urllib.request.urlopen(section_url).read()
    soup = BeautifulSoup(html, "html.parser")
    #Gets the raw data
    search_results = soup.find_all(class_="property_title")
    #Formats what I need
    return [(pdv.string.replace('\n', ''), pdv.get('href')) for pdv in search_results]
# eateries = getEateryNamesAndURLs(url)
# print(eateries)


def getCitiesURL(url,selector):
    html = urllib.request.urlopen(url).read()
    soup = BeautifulSoup(html, "html.parser")
    #Gets the raw data
    # search_results = soup.find_all('a',attrs={'class': 'geo_name'})#class_="geo_name")
    search_results = soup.select(selector)
    df = pd.DataFrame([(ciudad.get_text(), ciudad.get('href')) for ciudad in search_results])
    df.columns = ['city', 'url']
    return(df)

def saveToSQL(dataframe):
    engine = sa.create_engine(
         'mssql+pyodbc://zSocialHub:M1nsa1t39@tsp02.cloudapp.net/zSocialHub?driver=SQL+Server+Native+Client+13.0')
    try:
        dataframe.to_sql(name='DM_SOURCE_TRIPADVISOR_PAGES_RAW_PYTHON', con=engine,
                     if_exists='append', index=False)
    except sqlalchemy.exc.DBAPIError:
        print('Save Error!!!')


url_list = 'https://www.tripadvisor.es/Restaurants-g187427-Spain.html#LOCATION_LIST'
url_list_base_ini = 'https://www.tripadvisor.es/Restaurants-g187427-oa'
url_list_base_fin = '-Spain.html#LOCATION_LIST'
df = getCitiesURL(url_list,'.geo_name a')
saveToSQL(df)

for i in range(1, 5):
    url = url_list_base_ini + str(i*20) + url_list_base_fin
    df = getCitiesURL(url,'.geoList a')
    saveToSQL(df)
