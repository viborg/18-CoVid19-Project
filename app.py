print("==================================================")
print("==  The CoVid19-Project server has started ")
print("==  To kill, press Ctrl+C at the terminal")
print("==================================================")

from flask import Flask, jsonify, render_template
from shapely.geometry import Point
from shapely_geojson import dumps, Feature, FeatureCollection
import pandas as pd
import psycopg2
from psql_config import psql_pw
from datetime import date, datetime, timedelta

# Flask setup
app = Flask(__name__)

# Establish a connection to the database by creating a cursor object
conn = psycopg2.connect(host="localhost", port = 5432, database="CoVid19-Project", 
                        user="postgres", password=psql_pw)

# Read the entire time_series table into a dataframe
df = pd.read_sql_query("SELECT * FROM time_series", conn)

# Close the cursor and connection to so the server can allocate
conn.close()
    
# Create a GeoJSON object, from the data frame, with confirmed cases and deaths for one date
def createJSON(date):
    features = []
    for i in range(len(df)):
        confirmed_cases = int(df.iloc[i, df.columns.get_loc("Confirmed_cases_" + date)])
        if confirmed_cases > 0:
            feature = Feature(Point(df.iloc[i, df.columns.get_loc("Long")], df.iloc[i, df.columns.get_loc("Lat")]), 
                properties={'Combined_Key': df.iloc[i, df.columns.get_loc("Combined_Key")].strip(),
                            'Confirmed_cases': int(df.iloc[i, df.columns.get_loc("Confirmed_cases_" + date)]),
                            'Deaths': int(df.iloc[i, df.columns.get_loc("Deaths_" + date)])})
            features.append(feature)

    return features

# Create date string from a number of days since 01/22/2020
def getDate(delta_day):
    delta_day = int(delta_day)
    start_date = datetime(2020, 1, 22)
    d = start_date + timedelta(days = delta_day)
    date_str = d.strftime("%m/%d/%Y")
    return date_str

# Create a list of dictionaries (from the data frame) of the top cases for one date
def getTopCases(date):
    depth = 10  # number rows
    # date = getDate(date)
    cases = "Confirmed_cases_" + date
    df_curated = df[['Combined_Key', cases]]
    df_renamed = df_curated.rename(columns={'Combined_Key': 'Location', cases: 'Cases'})
    df_sorted = df_renamed.sort_values(by='Cases', ascending=False).iloc[:depth]
    dict_values = df_sorted.T.to_dict().values()
    cases = list(dict_values)
    return cases

# Create a list of dictionaries (from the data frame) of the top deaths for one date
def getTopDeaths(date):
    depth = 10  # number rows
    # date = getDate(date)
    deaths = "Deaths_" + date
    df_curated = df[['Combined_Key', deaths]]
    df_renamed = df_curated.rename(columns={'Combined_Key': 'Location', deaths: 'Deaths'})
    df_sorted = df_renamed.sort_values(by='Deaths', ascending=False).iloc[:depth]
    dict_values = df_sorted.T.to_dict().values()
    deaths = list(dict_values)
    return deaths

@app.route("/")
def index():
	return render_template('index.html')
        

@app.route('/date=<covid_date_inc>')
def getGeoJSON(covid_date_inc):
    features = createJSON(getDate(covid_date_inc))

    feature_collection = FeatureCollection(features)
    json_str = dumps(feature_collection, separators=(',', ':'))
    return json_str

@app.route('/casedate=<covid_date_inc>')
def topCases(covid_date_inc):
    case_list = getTopCases(getDate(covid_date_inc))
    return jsonify(case_list)

@app.route('/deathdate=<covid_date_inc>')
def topDeaths(covid_date_inc):
    death_list = getTopDeaths(getDate(covid_date_inc))
    return jsonify(death_list)


# Start the app
if __name__ == '__main__':
    app.run(debug=True)
