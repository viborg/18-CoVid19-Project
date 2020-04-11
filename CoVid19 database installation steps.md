# CoVid19 database installation steps

1. Start pgAdmin
2. Create a database named "CoVid19-Project"
3. Right-click the "CoVid19-Project" database and select the "Query tool..." option.  This will open a Query Editor.
4. Copy "CoVid19-Project-Table.sql"into the Query Editor.
5. Excute.  This will create a "time_series" table with all of the necessary columns.
6. Right-click the "time_series" table and select the "Import/Export..." option. This willl open a Import/Export data - table 'time_series' window.
7. Import the time_series_data.csv file.