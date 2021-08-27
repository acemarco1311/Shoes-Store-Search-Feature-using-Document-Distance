# Shoes-Store-Search-Feature-localhost
Searching feature for shoes store using Document Distance algorithm and substring to be more effective at searching.

This project use NodeJS, ExpressJS, VueJS with MSSQL Database

# About 
This project is an updated version of the old one, you can check out the demo of the old version at: https://www.youtube.com/watch?v=TNmvrnCt0DU. And the repository of the old version here: https://github.com/acemarco1311/Shoes-Store-Search-Feature.

# What is new in this version?
- Update searching for model name with Document Distance algorithm: the result will be sorted from the most relevant to the least relevant. Unlike old version, this new version allows users searching based on the model name in a more effective way. For example, to search for "Nike Air Force 1", we can search "nike", "nike2.,,3", "air", "1", "ike", etc, thanks to Document Distance algorithm and substring search.
- Use MSSQL Database instead of MySQL 
 
# File you need to care: 
The code for the website is in: search_feature folder

# Installation:
- Install NodeJS, MSSQL database
- Install ExpressJS step to step from the documentation: https://expressjs.com/en/starter/installing.html
- Install NodeJS module: mssql,msnodesqlv8
- Change the database configuration in search_feature/routes/index.js (const config): to fit your database setup

# DEMO
- https://www.youtube.com/watch?v=TNmvrnCt0DU.
- This is a demo for the old version, this new version is updated with a more effective searching

