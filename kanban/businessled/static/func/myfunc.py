import pandas as pd
from datetime import datetime

myObjects = {
    "Location": "Location",
    "LOCCOUNTRY": "Country",
    "LOCSTATE": "State",
    "LOCCITY": "City",
    "LOCDISTDISTRICT": "District",
    "LOCNAME": "Location",
    "DATEID": "Date ID",
    "SLREVENUE": "$ Revenue",
    "SLREVENUE_LY": "$ Revenue (LY)",
    "SLREVENUE_MTD": "$ Revenue (MTD)",
    "SLREVENUE_MTD_LY": "$ Revenue (MTD-LY)",
    "SLREVENUE_YTD": "$ Revenue (YTD)",
    "SLREVENUE_YTD_LY": "$ Revenue (YTD-LY)",
    "SLUNITS": "# Units",
    "SLUNITS_LY": "# Units (LY)",
    "SLUNITS_MTD": "# Units (MTD)",
    "SLUNITS_MTD_LY": "# Units (MTD-LY)",
    "SLUNITS_YTD": "# Units (YTD)",
    "SLUNITS_YTD_LY": "# Units (YTD-LY)",
    "SLTRANSACTIONS": "# Transactions",
    "SLTRANSACTIONS_LY": "# Transactions (LY)",
    "SLTRANSACTIONS_MTD": "# Transactions (MTD)",
    "SLTRANSACTIONS_MTD_LY": "# Transactions (MTD-LY)",
    "SLTRANSACTIONS_YTD": "# Transactions (YTD)",
    "SLTRANSACTIONS_YTD_LY": "# Transactions (YTD-LY)",
}


def human_format(num):
    magnitude = 0
    while abs(num) >= 1000:
        magnitude += 1
        num /= 1000.0
    # add more suffixes if you need them
    return "%.1f%s" % (num, ["", "K", "M", "G", "T", "P"][magnitude])


def round_num(num):
    return round(num)


def growth100(num):
    return round(num * 100, 2)


def date_string(datey):
    return datey.strftime("%Y-%m-%d")


def string_date(stringy):
    return datetime.strptime(stringy, "%Y-%m-%d")


def getNumericColumns(df):
    numericColumns = []
    for columnName in df.columns:
        if pd.api.types.is_numeric_dtype(df[columnName]):
            numericColumns.append(columnName)
    return numericColumns


def genNestedDataList(df, nestedColumns, numericColumns, parentColumns=[], index=0):
    if len(parentColumns) == len(nestedColumns) - 1:
        tmpdf = df[[*nestedColumns[index : index + 1], *numericColumns]].copy()
        tmpdf.rename(columns={nestedColumns[index]: "Location"}, inplace=True)
        data = tmpdf.to_dict(orient="records")
        newParentColumns = []
    else:
        data = []
        newParentColumns = parentColumns.copy()
        newParentColumns.append(nestedColumns[len(parentColumns)])
        g = df[newParentColumns + numericColumns].groupby(
            newParentColumns, as_index=False
        )
        groupdf = g.agg("sum")
        for idx, row in groupdf.iterrows():
            subdf = df.iloc[list(list(g.indices.values())[idx])].copy()
            _children = genNestedDataList(
                subdf, nestedColumns, numericColumns, newParentColumns, index + 1
            )
            d = dict(Location=row[nestedColumns[index]])
            for columnName in numericColumns:
                d[columnName] = row[columnName]
            d["_children"] = _children
            data.append(d)
    return data


def genNestedColumns(df):
    data = []
    numericColumnsy = []
    numericColumnsy = getNumericColumns(df)
    numericColumnsy.insert(0, "Location")
    for idx, columnName in enumerate(pd.Index(numericColumnsy)):
        title = myObjects[columnName]
        d = {"title": title, "field": columnName, "width": 250 if idx == 0 else 200}
        if idx == 0:
            d["responsive"] = 0
            d["frozen"] = True
        if idx != 0:
            d["formatter"] = "f__paramabbreviateNumber__f"
        data.append(d)
    return data
