import sqlite3
import urllib
import pyodbc
import pandas as pd

conn_sqlite = sqlite3.connect("businessled/businessled.db")
curs_sqlite = conn_sqlite.cursor()

# users
sql_users = """select * from users """
df_users = pd.read_sql_query(sql_users, conn_sqlite)
df_users.reset_index(drop=True, inplace=True)
curs_sqlite.execute(
    """
CREATE TABLE if not exists users(
      [id] [int] TEXT,
      [username] TEXT,
      [email] TEXT,
      [password] BLOB
      )
"""
)
df_users.to_sql("users", con=conn_sqlite, if_exists="replace", index=False)
print("users")

conn_sqlite.commit()
# conn_sql.commit()
